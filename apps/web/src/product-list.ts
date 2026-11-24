import type { DecisionScene, Product, RankedItem, SimulatedPrice } from "@pausal/bundle-schema";

/** `label` is the short name when the pipeline wrote one, else the full name. `bid` is null without an active campaign. */
export type ListItem = { product: Product; label: string; reason: string; relevance: number; bid: SimulatedPrice | null };
export type ProductListView = { top: ListItem; rest: ListItem[] };

/** What the list shows. Order comes from `rankAt`; no list where analysis is unavailable (fail closed). */
export function productList(scene: DecisionScene | null, ranked: readonly RankedItem[], products: ReadonlyMap<string, Product>): ProductListView | null {
  if (!scene || scene.outcome === "analysisUnavailable") return null;
  // A missing product file is a decide --check failure; skip it rather than show a blank tile.
  const items = ranked.flatMap((r): ListItem[] => {
    const product = products.get(r.productId);
    return product ? [{ product, label: product.shortName ?? product.name, reason: r.reason, relevance: r.relevance, bid: r.bid }] : [];
  });
  const [top, ...rest] = items;
  return top ? { top, rest } : null;
}
