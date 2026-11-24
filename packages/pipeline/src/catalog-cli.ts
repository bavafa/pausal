// Usage: pnpm abo build   builds data/catalog/slice.json and the embedding index (AD-12)
//        pnpm abo products writes data/products/<id>.json and images for products referenced by analysis (AD-19)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { RANKED_MAX, validateAnalysis, validateSceneTypes } from "@pausall/bundle-schema";
import { rankFits } from "@pausall/policy";
import { Ledger, mapLimit } from "./call.ts";
import { embedText, sliceCatalog, toCatalogItem, toProduct, type CatalogItem } from "./catalog.ts";
import { Qwen, readKeys } from "./clients.ts";
import { loadPipelineConfig } from "./config.ts";
import { canonicalJson } from "./decide.ts";

const root = resolve(import.meta.dirname, "../../..");
const cat = join(root, "data/catalog");
const SLICE_SIZE = 20_000;
const BATCH = 10;

export type IndexMeta = { model: string; dimensions: number; ids: string[] };

export function loadCatalog(): { items: CatalogItem[]; meta: IndexMeta; vectors: Float32Array } {
  const items = JSON.parse(readFileSync(join(cat, "slice.json"), "utf8")) as CatalogItem[];
  const meta = JSON.parse(readFileSync(join(cat, "index.json"), "utf8")) as IndexMeta;
  const buf = readFileSync(join(cat, "index.f32"));
  const vectors = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  if (meta.ids.length !== items.length || vectors.length !== items.length * meta.dimensions) throw new Error("catalog slice and index do not match; run pnpm abo build");
  return { items, meta, vectors };
}

async function build(): Promise<void> {
  const raw = join(cat, "raw");
  if (!existsSync(join(raw, "listings"))) execFileSync("tar", ["xf", join(cat, "abo-listings.tar"), "-C", (mkdirSync(raw, { recursive: true }), raw)]);
  const dir = join(raw, "listings/metadata");
  const items: CatalogItem[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json.gz")).sort()) {
    for (const line of gunzipSync(readFileSync(join(dir, f))).toString("utf8").split("\n")) {
      if (!line.trim()) continue;
      const it = toCatalogItem(JSON.parse(line) as Record<string, unknown>);
      if (it) items.push(it);
    }
  }
  const slice = sliceCatalog(items, SLICE_SIZE);
  console.log(`catalog: ${items.length} usable listings, slice of ${slice.length}.`);

  const cfg = loadPipelineConfig(root);
  const keys = readKeys(join(root, ".env"));
  const ledger = new Ledger(cfg.costCapUsd);
  const qwen = new Qwen(keys.qwenBaseUrl, keys.qwenKey, { retry: { timeoutMs: cfg.timeoutMs, retries: cfg.retries }, prices: cfg.pricesUsdPerMillionTokens, ledger });
  const dims = cfg.embeddingDimensions;
  const batches = Array.from({ length: Math.ceil(slice.length / BATCH) }, (_, i) => slice.slice(i * BATCH, (i + 1) * BATCH));
  let done = 0;
  const vecs = await mapLimit(batches, 8, async (b) => {
    const v = await qwen.embed(cfg.models.embedding, b.map(embedText), dims, "catalogEmbed");
    if (++done % 200 === 0) console.log(`catalog: ${done}/${batches.length} batches, $${ledger.totalUsd.toFixed(4)}`);
    return v;
  });
  const flat = new Float32Array(slice.length * dims);
  vecs.flat().forEach((v, i) => flat.set(v, i * dims));
  writeFileSync(join(cat, "slice.json"), JSON.stringify(slice));
  writeFileSync(join(cat, "index.f32"), flat);
  writeFileSync(join(cat, "index.json"), JSON.stringify({ model: cfg.models.embedding, dimensions: dims, ids: slice.map((s) => s.id) } satisfies IndexMeta));
  console.log(`catalog: index written with ${cfg.models.embedding} at ${dims} dimensions. Cost $${ledger.totalUsd.toFixed(4)}, ${JSON.stringify(ledger.stages)}`);
}

/** IDs the decide step will reference: the ranked top of every scene's fits, exactly as decisions keep them. */
function referencedIds(): Set<string> {
  const types = validateSceneTypes(JSON.parse(readFileSync(join(root, "config/scene-types.json"), "utf8")));
  if (!types.ok) throw new Error("config/scene-types.json is invalid");
  const ids = new Set<string>();
  for (const f of readdirSync(join(root, "data/analysis")).filter((f) => f.endsWith(".json"))) {
    const a = validateAnalysis(JSON.parse(readFileSync(join(root, "data/analysis", f), "utf8")), types.value);
    if (!a.ok) throw new Error(`data/analysis/${f} is invalid: ${a.issues[0]?.path} ${a.issues[0]?.message}`);
    for (const s of a.value.scenes) for (const r of rankFits(s.fits ?? []).slice(0, RANKED_MAX)) ids.add(r.productId);
  }
  return ids;
}

function products(): void {
  const items = new Map((JSON.parse(readFileSync(join(cat, "slice.json"), "utf8")) as CatalogItem[]).map((i) => [i.id, i]));
  const ids = referencedIds();
  const imageCsv = join(cat, "raw/images/metadata/images.csv.gz");
  if (!existsSync(imageCsv)) execFileSync("tar", ["xf", join(cat, "abo-images-small.tar"), "-C", join(cat, "raw"), "images/metadata/images.csv.gz"]);
  const imagePath = new Map(
    gunzipSync(readFileSync(imageCsv))
      .toString("utf8")
      .split("\n")
      .slice(1)
      .map((l) => l.split(","))
      .map((c) => [c[0] ?? "", c[3] ?? ""] as const),
  );
  const pubDir = join(root, "apps/web/public/products");
  const tmp = join(cat, "raw/extract");
  const wanted = [...ids].filter((id) => items.has(id));
  const members = wanted.map((id) => `images/small/${imagePath.get(items.get(id)?.imageId ?? "")}`);
  if (members.some((m) => m.endsWith("/undefined"))) throw new Error("a referenced product has no image in images.csv");
  if (members.length) execFileSync("tar", ["xf", join(cat, "abo-images-small.tar"), "-C", (mkdirSync(tmp, { recursive: true }), tmp), ...members]);
  wanted.forEach((id, i) => {
    const p = toProduct(items.get(id) as CatalogItem);
    writeFileSync(join(pubDir, `${id}.jpg`), readFileSync(join(tmp, members[i] as string)));
    writeFileSync(join(root, "data/products", `${id}.json`), canonicalJson(p));
  });
  // AD-19: a product file nothing references is removed with its image; fixture products stay while the fixture references them.
  let removed = 0;
  for (const f of readdirSync(join(root, "data/products")).filter((f) => f.endsWith(".json"))) {
    const id = f.slice(0, -5);
    if (ids.has(id)) continue;
    rmSync(join(root, "data/products", f));
    rmSync(join(pubDir, `${id}.jpg`), { force: true });
    removed++;
  }
  const unknown = [...ids].filter((id) => !items.has(id) && !existsSync(join(root, "data/products", `${id}.json`)));
  if (unknown.length) throw new Error(`referenced products not in the slice: ${unknown.join(", ")}`);
  console.log(`products: wrote ${wanted.length}, removed ${removed}.`);
}

const cmd = process.argv[2];
if (import.meta.main && cmd === "build") await build();
else if (import.meta.main && cmd === "products") products();
else if (import.meta.main) {
  console.error("usage: pnpm abo build | products");
  process.exit(1);
}
