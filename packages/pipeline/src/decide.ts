import { VERDICTS, type Analysis, type AnalysisScene, type Campaign, type Decisions, type DecisionScene, type Issue, type Outcome, type Panel, type Product, type Thresholds } from "@pausal/bundle-schema";
import { evaluateScene, reasonLine, SENTIMENT_TABLE, taglineOrName } from "@pausal/policy";

export type InputHashes = Pick<Decisions, "analysisHash" | "thresholdsHash" | "campaignsHash">;

/** Shown when the panel inputs are missing; caution, never safe, and no alarm wording. */
const UNAVAILABLE_PANEL: Panel = { contextLabel: { primary: "Unavailable" }, moodLabel: "Unavailable", sentiment: 0, safeTag: "caution" };

function panelFor(scene: AnalysisScene, outcome: Outcome): Panel {
  const { sceneType, sentimentLevel, judgments } = scene;
  if (outcome === "analysisUnavailable" || !sceneType || sentimentLevel === undefined || !judgments) return UNAVAILABLE_PANEL;
  const { sentiment, moodLabel } = SENTIMENT_TABLE[sentimentLevel];
  const worse = Math.max(VERDICTS.indexOf(judgments.jev.verdict), VERDICTS.indexOf(judgments.qwen.verdict));
  return {
    contextLabel: sceneType.secondary === undefined ? { primary: sceneType.primary } : { primary: sceneType.primary, secondary: sceneType.secondary },
    moodLabel,
    sentiment,
    safeTag: VERDICTS[worse] ?? "caution",
  };
}

/** Pure: one validated analysis to its decisions. No description or judge reasons are carried over (AD-2). */
export function deriveDecisions(
  analysis: Analysis,
  thresholds: Thresholds,
  campaigns: readonly Campaign[],
  products: ReadonlyMap<string, Product>,
  hashes: InputHashes,
): Decisions {
  const scenes = analysis.scenes.map((scene): DecisionScene => {
    const e = evaluateScene(scene, thresholds, campaigns);
    const out: DecisionScene = {
      id: scene.id,
      startMs: scene.startMs,
      endMs: scene.endMs,
      outcome: e.outcome,
      topProductId: e.topProductId,
      price: e.price,
      split: e.split,
      ranked: e.ranked.map((r) => {
        // Only text from the product file reaches the reason line; unknown matched names are dropped (AD-7).
        const matched = new Set(scene.fits?.find((f) => f.productId === r.productId)?.matched);
        const features = products.get(r.productId)?.keyFeatures.filter((k) => matched.has(k)) ?? [];
        const c = campaigns.find((x) => x.productId === r.productId && x.active);
        return { ...r, reason: reasonLine(scene.sceneType?.primary, features), bid: c ? { cents: c.bidCents, simulated: true as const } : null };
      }),
      panel: panelFor(scene, e.outcome),
    };
    // A missing product file is reported by productIssues, which stops the run before anything is written.
    const product = e.outcome === "ad" && e.topProductId !== null ? products.get(e.topProductId) : undefined;
    if (product) out.tagline = taglineOrName(scene.tagline, product);
    return out;
  });
  return { clipId: analysis.clipId, durationMs: analysis.durationMs, holdMs: thresholds.holdMs, ...hashes, scenes };
}

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v !== null && typeof v === "object"
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
      : v;

/** Keys sorted at every depth, 2-space indent, trailing newline. */
export const canonicalJson = (value: unknown): string => `${JSON.stringify(sortKeys(value), null, 2)}\n`;

/** AD-19: every `ranked[].productId` has a product file, and every product file is referenced. */
export function productIssues(decisions: readonly Decisions[], productIds: readonly string[]): Issue[] {
  const referenced = new Set(decisions.flatMap((d) => d.scenes.flatMap((s) => s.ranked.map((r) => r.productId))));
  const have = new Set(productIds);
  return [
    ...[...referenced].filter((id) => !have.has(id)).map((id) => ({ path: id, message: "is referenced in decisions but has no product file" })),
    ...[...have].filter((id) => !referenced.has(id)).map((id) => ({ path: id, message: "has a product file but is not referenced in any decisions" })),
  ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
