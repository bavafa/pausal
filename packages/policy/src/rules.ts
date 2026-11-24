import { CATEGORIES, RANKED_MAX, REASONS, type AnalysisScene, type Campaign, type Fit, type Outcome, type Ranked, type Reason, type SimulatedPrice, type SimulatedSplit, type Thresholds } from "@pausall/bundle-schema";
import { priceFor, roundHalfUp, splitPrice } from "./money.ts";

/** The only rule ids used anywhere; `failed` lists ids in this order, and `REASONS` order decides the outcome. */
export const RULE_IDS = ["R1", "R2", "R3", "R3b", "R4", "R5", "R6"] as const;
export type RuleId = (typeof RULE_IDS)[number];

const RULE_REASON: Record<RuleId, Reason> = {
  R6: "analysisUnavailable",
  R1: "sensitiveScene",
  R2: "sensitiveScene",
  R5: "sensitiveScene",
  R3: "nothingFits",
  R3b: "nothingFits",
  R4: "noActiveCampaign",
};

export type SceneEvaluation = {
  outcome: Outcome;
  failed: RuleId[];
  ranked: Ranked[];
  topProductId: string | null;
  price: SimulatedPrice | null;
  split: SimulatedSplit | null;
};

/** Relevance (rounded) descending, ties by lower product ID; rank 1 is the top product (AD-18). */
export function rankFits(fits: readonly Fit[]): (Ranked & { fit: Fit })[] {
  return fits
    .map((fit) => ({ productId: fit.productId, relevance: roundHalfUp(fit.relevance), fit }))
    .sort((a, b) => b.relevance - a.relevance || (a.productId < b.productId ? -1 : a.productId > b.productId ? 1 : 0));
}

/** Runs R1 to R6 and R3b on one validated analysis scene; any absent input fails its rule (AD-4). */
export function evaluateScene(scene: AnalysisScene, thresholds: Thresholds, campaigns: readonly Campaign[]): SceneEvaluation {
  const j = scene.judgments;
  const ranking = scene.fits ? rankFits(scene.fits) : [];
  const top = ranking[0];
  const campaign = top && campaigns.find((c) => c.productId === top.productId);
  const pass: Record<RuleId, boolean> = {
    R1: !!j && j.jev.verdict === "safe" && Math.min(j.jev.confidence, j.qwen.confidence) >= thresholds.safetyConfidence,
    // the stored `flagged` boolean is ignored (AD-15)
    R2: !!j && CATEGORIES.every((c) => j.jev.categories[c].p < thresholds.categoryCutoffs[c] && j.qwen.categories[c].p < thresholds.categoryCutoffs[c]),
    R3: !!top && top.relevance >= thresholds.relevance,
    R3b: !!top && top.fit.jevFitP >= thresholds.r3b.jevFitP && top.fit.embeddingSim >= thresholds.r3b.embeddingSim,
    R4: campaign?.active === true,
    R5: !!j && j.jev.verdict === "safe" && j.qwen.verdict === "safe",
    R6:
      scene.status === "ok" &&
      scene.invalid.length === 0 &&
      !!j &&
      [scene.description, scene.sceneType, scene.sentimentLevel, scene.fits].every((v) => v !== undefined),
  };
  const failed = RULE_IDS.filter((id) => !pass[id]);
  const outcome: Outcome = REASONS.find((r) => failed.some((id) => RULE_REASON[id] === r)) ?? "ad";
  const price = outcome === "ad" && campaign && top ? priceFor(campaign.bidCents, top.relevance, thresholds) : null;
  return {
    outcome,
    failed,
    ranked: ranking.slice(0, RANKED_MAX).map(({ productId, relevance }) => ({ productId, relevance })),
    topProductId: top?.productId ?? null,
    price,
    split: price && splitPrice(price),
  };
}
