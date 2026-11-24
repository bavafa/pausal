// Usage: pnpm abo build   builds data/catalog/slice.json and the embedding index (AD-12)
//        pnpm abo products writes data/products/<id>.json and images for products referenced by analysis (AD-19)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { RANKED_MAX, validateAnalysis, validateSceneTypes, type Campaign } from "@pausal/bundle-schema";
import { rankFits } from "@pausal/policy";
import { Ledger, mapLimit } from "./call.ts";
import { embedText, simulatedCampaign, sliceCatalog, toCatalogItem, toProduct, type CatalogItem } from "./catalog.ts";
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

async function products(): Promise<void> {
  const items = new Map((JSON.parse(readFileSync(join(cat, "slice.json"), "utf8")) as CatalogItem[]).map((i) => [i.id, i]));
  const ids = referencedIds();
  const imageCsv = join(cat, "raw/images/metadata/images.csv.gz");
  if (!existsSync(imageCsv)) execFileSync("tar", ["xf", join(cat, "abo-images-small.tar"), "-C", join(cat, "raw"), "images/metadata/images.csv.gz"]);
  const imagePath = new Map(
    gunzipSync(readFileSync(imageCsv))
      .toString("utf8")
      .split(/\r?\n/) // images.csv has CRLF line endings
      .slice(1)
      .map((l) => l.split(","))
      .map((c) => [c[0] ?? "", c[3] ?? ""] as const),
  );
  const pubDir = join(root, "apps/web/public/products");
  const tmp = join(cat, "raw/extract");
  const wanted = [...ids].filter((id) => items.has(id));
  const members = wanted.map((id) => `images/small/${imagePath.get(items.get(id)?.imageId ?? "")}`);
  if (members.some((m) => m.endsWith("/undefined"))) throw new Error("a referenced product has no image in images.csv");
  if (members.length) {
    // A member list file keeps the command line short for hundreds of images.
    mkdirSync(tmp, { recursive: true });
    writeFileSync(join(tmp, "members.txt"), `${[...new Set(members)].join("\n")}\n`);
    execFileSync("tar", ["xf", join(cat, "abo-images-small.tar"), "-C", tmp, "-T", join(tmp, "members.txt")]);
  }
  // A short name already written is kept, so a rerun asks the model only about new products.
  const file = (id: string) => join(root, "data/products", `${id}.json`);
  const known = new Map(wanted.filter((id) => existsSync(file(id))).map((id) => [id, (JSON.parse(readFileSync(file(id), "utf8")) as { shortName?: string }).shortName]));
  const fresh = await shortNames(wanted.filter((id) => !known.get(id)).map((id) => ({ id, name: (items.get(id) as CatalogItem).name })));
  wanted.forEach((id, i) => {
    const p = toProduct(items.get(id) as CatalogItem);
    const shortName = known.get(id) ?? fresh.get(id);
    writeFileSync(join(pubDir, `${id}.jpg`), readFileSync(join(tmp, members[i] as string)));
    writeFileSync(file(id), canonicalJson(shortName ? { ...p, shortName } : p));
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
  // Simulated campaigns (AD-18): keep entries for referenced products, add a deterministic one for each new product.
  const campaignsFile = join(root, "config/campaigns.json");
  const campaigns = (JSON.parse(readFileSync(campaignsFile, "utf8")) as Campaign[]).filter((c) => ids.has(c.productId));
  for (const id of wanted) if (!campaigns.some((c) => c.productId === id)) campaigns.push(simulatedCampaign(id));
  writeFileSync(campaignsFile, canonicalJson(campaigns.sort((a, b) => (a.productId < b.productId ? -1 : 1))));
  const unknown = [...ids].filter((id) => !items.has(id) && !existsSync(join(root, "data/products", `${id}.json`)));
  if (unknown.length) throw new Error(`referenced products not in the slice: ${unknown.join(", ")}`);
  console.log(`products: wrote ${wanted.length}, removed ${removed}, ${campaigns.length} campaigns.`);
}

/** Two to four plain words per product ("Wedge pumps", "Teak garden bench") from the text model; a bad answer leaves the full name. */
async function shortNames(list: { id: string; name: string }[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!list.length) return out;
  const cfg = loadPipelineConfig(root);
  const keys = readKeys(join(root, ".env"));
  const ledger = new Ledger(cfg.costCapUsd);
  const qwen = new Qwen(keys.qwenBaseUrl, keys.qwenKey, { retry: { timeoutMs: cfg.timeoutMs, retries: cfg.retries }, prices: cfg.pricesUsdPerMillionTokens, ledger });
  const system = [
    "You shorten product listing titles for a small product tile. For each item give 2 to 4 plain words a shopper would say, in sentence case.",
    "Name the kind of product with the detail that tells it apart from similar products: its subject, pattern, design or material. Never the brand, size, colour code, pack count or model number.",
    "Two different products must not share a name, so \"Canvas wall art\" or \"Framed print\" alone is never enough.",
    'Examples: "206 Collective Women\'s Battelle Closed-Toe Covered Wedge Pump, Neutral, 7 C/D US" becomes "Wedge pumps". "Rivet Abstract Modern Gold Halo Painting on White Canvas Wall Art Decor, 24 x 24" becomes "Gold halo canvas". "Stainless Steel Cross Pendant with Textured Black IP on 24 inch Round Box Chain" becomes "Textured cross pendant".',
    'Answer with JSON only: {"names": {"<id>": "<short name>"}}.',
  ].join("\n");
  const batches = Array.from({ length: Math.ceil(list.length / 40) }, (_, i) => list.slice(i * 40, i * 40 + 40));
  await mapLimit(batches, 4, async (batch) => {
    const user = JSON.stringify(Object.fromEntries(batch.map((b) => [b.id, b.name])));
    const raw = JSON.parse(await qwen.chat(cfg.models.text, [{ role: "system", content: system }, { role: "user", content: user }], "shortName", true)) as { names?: Record<string, unknown> };
    for (const { id } of batch) {
      const n = raw.names?.[id];
      if (typeof n === "string" && n.trim() && n.trim().length <= 40) out.set(id, n.trim());
    }
  });
  console.log(`short names: ${out.size} of ${list.length}, cost $${ledger.totalUsd.toFixed(4)}.`);
  return out;
}

const cmd = process.argv[2];
if (import.meta.main && cmd === "build") await build();
else if (import.meta.main && cmd === "products") await products();
else if (import.meta.main) {
  console.error("usage: pnpm abo build | products");
  process.exit(1);
}
