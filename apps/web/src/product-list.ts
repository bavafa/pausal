import type { DecisionScene, Product, RankedItem } from "@pausall/bundle-schema";

export type ProductListView = { top: { product: Product; reason: string; relevance: number }; rest: Product[] };

/** What the list shows. Order comes from `rankAt`; no list where analysis is unavailable (fail closed). */
export function productList(scene: DecisionScene | null, ranked: readonly RankedItem[], products: ReadonlyMap<string, Product>): ProductListView | null {
  if (!scene || scene.outcome === "analysisUnavailable") return null;
  // A missing product file is a decide --check failure; skip it rather than show a blank tile.
  const items = ranked.flatMap((r) => {
    const product = products.get(r.productId);
    return product ? [{ product, reason: r.reason, relevance: r.relevance }] : [];
  });
  const [top, ...rest] = items;
  return top ? { top, rest: rest.map((i) => i.product) } : null;
}
