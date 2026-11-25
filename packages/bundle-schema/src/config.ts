import { array, at, bool, cosine, done, fail, integer, nonEmptyString, nonNegInt, object, prob, type Int, type Issue, type Result } from "./check.ts";

export const CATEGORIES = ["violence", "deathOrGrief", "sexual", "medicalTrauma", "childFocused", "intenseDialogue"] as const;
export type Category = (typeof CATEGORIES)[number];

/** `config/thresholds.json`. Floors are schema invariants (AD-20); lowering one needs a schema edit and an ADR. */
export type Thresholds = {
  safetyConfidence: number;
  relevance: Int;
  r3b: { jevFitP: number; embeddingSim: number };
  categoryCutoffs: Record<Category, number>;
  holdMs: Int;
  taglineGateMargin: number;
  /** Share of the simulated price that scales with relevance (0 to 1). */
  pricing: { relevanceWeight: number };
};

export function validateThresholds(json: unknown): Result<Thresholds> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  prob(json.safetyConfidence, "safetyConfidence", issues, 0.8, 1);
  integer(json.relevance, "relevance", issues, 50, 100);
  if (object(json.r3b, "r3b", issues)) {
    prob(json.r3b.jevFitP, "r3b.jevFitP", issues);
    cosine(json.r3b.embeddingSim, "r3b.embeddingSim", issues);
  }
  if (object(json.categoryCutoffs, "categoryCutoffs", issues)) {
    for (const c of CATEGORIES) prob(json.categoryCutoffs[c], at("categoryCutoffs", c), issues, 0, 0.5);
  }
  integer(json.holdMs, "holdMs", issues, 5000);
  prob(json.taglineGateMargin, "taglineGateMargin", issues);
  if (object(json.pricing, "pricing", issues)) prob(json.pricing.relevanceWeight, "pricing.relevanceWeight", issues);
  return done(issues, () => json as Thresholds);
}

/** `config/campaigns.json`: one entry per product (AD-18). `budgetCents` is never decremented. */
export type Campaign = { productId: string; bidCents: Int; budgetCents: Int; active: boolean };

export function validateCampaigns(json: unknown): Result<Campaign[]> {
  const issues: Issue[] = [];
  if (!array(json, "", issues)) return done(issues, () => json as never);
  const seen = new Set<unknown>();
  json.forEach((c, i) => {
    const p = at("", i);
    if (!object(c, p, issues)) return;
    if (nonEmptyString(c.productId, at(p, "productId"), issues) && seen.has(c.productId)) fail(issues, at(p, "productId"), "is a duplicate");
    seen.add(c.productId);
    nonNegInt(c.bidCents, at(p, "bidCents"), issues);
    nonNegInt(c.budgetCents, at(p, "budgetCents"), issues);
    bool(c.active, at(p, "active"), issues);
  });
  return done(issues, () => json as Campaign[]);
}

/** `config/scene-types.json`: the fixed scene-type list, at most 255 labels (Jev Choice limit). */
export function validateSceneTypes(json: unknown): Result<string[]> {
  const issues: Issue[] = [];
  if (!array(json, "", issues)) return done(issues, () => json as never);
  if (json.length === 0 || json.length > 255) fail(issues, "(root)", "must hold 1 to 255 labels");
  json.forEach((t, i) => {
    if (nonEmptyString(t, at("", i), issues) && json.indexOf(t) !== i) fail(issues, at("", i), "is a duplicate");
  });
  return done(issues, () => json as string[]);
}
