import { createHash } from "node:crypto";
import type { Campaign, Int, Product } from "@pausall/bundle-schema";

/** One product in the local ABO slice (AD-12). Never committed; product files are written from it (AD-19). */
export type CatalogItem = { id: string; name: string; productType: string; description: string; keyFeatures: string[]; imageId: string };

type Lang = { language_tag?: string; value?: unknown }[] | undefined;
const en = (v: Lang): string[] =>
  (v ?? []).filter((x) => x.language_tag === undefined || x.language_tag.startsWith("en_")).map((x) => String(x.value ?? "").trim()).filter(Boolean);

const MAX_FEATURE = 48;
const MAX_FEATURES = 6;

/** Maps one ABO listing line to a catalog item, or null when it has no English name, bullet or main image. */
export function toCatalogItem(r: Record<string, unknown>): CatalogItem | null {
  const name = en(r.item_name as Lang)[0];
  const bullets = en(r.bullet_point as Lang);
  const imageId = r.main_image_id;
  if (!name || bullets.length === 0 || typeof imageId !== "string") return null;
  const short = [...en(r.color as Lang), ...en(r.material as Lang), ...en(r.style as Lang), ...bullets].filter((f) => f.length <= MAX_FEATURE);
  return {
    id: String(r.item_id),
    name: name.length > 120 ? `${name.slice(0, 117)}...` : name,
    productType: String((r.product_type as { value?: string }[] | undefined)?.[0]?.value ?? "OTHER"),
    description: bullets.slice(0, 2).join(" ").slice(0, 300),
    keyFeatures: [...new Set(short)].slice(0, MAX_FEATURES),
    imageId,
  };
}

/** Deterministic slice: dedupe by exact name, order by item ID, keep the first `size`. */
export function sliceCatalog(items: Iterable<CatalogItem>, size: number): CatalogItem[] {
  const byName = new Map<string, CatalogItem>();
  for (const it of items) {
    const prev = byName.get(it.name);
    if (!prev || it.id < prev.id) byName.set(it.name, it);
  }
  return [...byName.values()].sort((a, b) => (a.id < b.id ? -1 : 1)).slice(0, size);
}

/** Text embedded for retrieval; the scene description is embedded the same way at query time. */
export const embedText = (it: CatalogItem): string => `${it.name}. ${it.productType.toLowerCase().replace(/_/g, " ")}. ${it.keyFeatures.join(", ")}. ${it.description}`;

export const ATTRIBUTION = "Amazon Berkeley Objects, Amazon.com, CC BY 4.0. Text shortened.";

export const toProduct = (it: CatalogItem): Product => ({
  id: it.id,
  name: it.name,
  imagePath: `products/${it.id}.jpg`,
  description: it.description,
  keyFeatures: it.keyFeatures,
  attribution: ATTRIBUTION,
});

export function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i] as number;
    const y = b[i] as number;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}

/** Top `k` items by cosine similarity to `query`; `vectors` is row-major with `dims` columns. */
export function topK(query: readonly number[], vectors: Float32Array, dims: number, k: number): { index: number; sim: number }[] {
  const n = vectors.length / dims;
  const scored: { index: number; sim: number }[] = [];
  for (let i = 0; i < n; i++) scored.push({ index: i, sim: cosine(query, vectors.subarray(i * dims, (i + 1) * dims)) });
  return scored.sort((a, b) => b.sim - a.sim || a.index - b.index).slice(0, k);
}

/** Deterministic simulated campaign: bid 50 to 150 cents, budget 200 times the bid, 1 in 10 inactive so "no active campaign" still occurs. */
export function simulatedCampaign(productId: string): Campaign {
  const h = createHash("sha256").update(productId).digest();
  const bidCents = 50 + ((h[0] as number) % 101);
  return { productId, bidCents: bidCents as Int, budgetCents: (bidCents * 200) as Int, active: (h[1] as number) % 10 !== 0 };
}

// Words that tell variants apart (colour, size, unit) or carry no meaning; the rest name the product.
const NOT_IDENTITY = new Set(
  "black white grey gray gold silver brown blue green red pink purple yellow orange navy beige ivory cream neutral tan dark light matte copper bronze rose multi multicolor clear inch inches cm mm ft in of and with the for to on by x uk us eu india size small medium large xl xs".split(" "),
);

/** Words of a title before its first comma, without brackets, digits, colours, sizes, units and filler. */
export const familyWords = (name: string): Set<string> =>
  new Set((name.split(",")[0] ?? name).toLowerCase().replace(/\([^)]*\)/g, " ").split(/[^a-z]+/).filter((w) => w.length > 1 && !NOT_IDENTITY.has(w)));

/** Two titles name one product in another size or colour when at least 80% of their identity words are shared. */
export function sameFamily(a: string, b: string): boolean {
  const x = familyWords(a);
  const y = familyWords(b);
  const shared = [...x].filter((w) => y.has(w)).length;
  const all = x.size + y.size - shared;
  return all > 0 && shared / all >= 0.8;
}

/** Catalog vectors this close are the same product in another size, colour or near-identical design. */
export const VARIANT_SIM = 0.95;

/**
 * The first `k` hits that are not a variant of an earlier hit: same family by title, or a catalog vector within VARIANT_SIM.
 * Retrieval is the one place variants are dropped, so analysis, decisions and product files all agree.
 */
export function distinctHits<H extends { index: number }>(hits: readonly H[], items: readonly { name: string }[], vectors: Float32Array, dims: number, k: number): H[] {
  const kept: H[] = [];
  const vec = (i: number) => vectors.subarray(i * dims, (i + 1) * dims);
  const name = (i: number) => (items[i] as { name: string }).name;
  for (const h of hits) {
    if (kept.length === k) break;
    if (kept.some((o) => sameFamily(name(o.index), name(h.index)) || cosine(vec(o.index), vec(h.index)) >= VARIANT_SIM)) continue;
    kept.push(h);
  }
  return kept;
}
