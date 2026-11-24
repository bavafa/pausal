import type { Decisions, Product, Reason, SimulatedPrice, SimulatedSplit } from "@pausal/bundle-schema";
import { resolvePause } from "@pausal/policy";

/** Policy wording for each no-ad reason (docs/policy/ad-suppression-policy.md). */
export const REASON_TEXT: Record<Reason, string> = {
  analysisUnavailable: "No ad here: analysis unavailable.",
  sensitiveScene: "No ad here: sensitive scene.",
  nothingFits: "No ad here: nothing fits well.",
  noActiveCampaign: "No ad here: no active campaign.",
};

export type PauseView =
  | { kind: "ad"; product: Product; tagline: string; because: string; price: SimulatedPrice; split: SimulatedSplit }
  | { kind: "note"; reason: Reason; text: string };

const note = (reason: Reason): PauseView => ({ kind: "note", reason, text: REASON_TEXT[reason] });

/** What the pause view shows at `tMs`. Null decisions or a missing product fail closed to analysis unavailable. */
export function pauseView(decisions: Decisions | null, products: ReadonlyMap<string, Product>, tMs: number): PauseView {
  if (!decisions) return note("analysisUnavailable");
  const r = resolvePause(decisions, tMs);
  if (r.outcome !== "ad") return note(r.outcome);
  const product = r.scene.topProductId ? products.get(r.scene.topProductId) : undefined;
  const { price, split } = r.scene;
  if (!product || !price || !split) return note("analysisUnavailable");
  const { primary, secondary } = r.scene.panel.contextLabel;
  return {
    kind: "ad",
    product,
    tagline: r.scene.tagline ?? product.name,
    because: `Shown because this scene matches: ${secondary ? `${primary}, ${secondary}` : primary}.`,
    price,
    split,
  };
}

/** One line for the polite live region. */
export const announce = (v: PauseView) =>
  v.kind === "ad" ? `Paused. Sponsored, simulated ad: ${v.product.shortName ?? v.product.name}. ${v.tagline}` : `Paused. ${v.text}`;
