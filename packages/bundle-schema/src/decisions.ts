import { array, at, clipId, done, fail, integer, literal, nonEmptyString, nonNegInt, object, oneOf, onlyKeys, type Int, type Issue, type Rec, type Result } from "./check.ts";
import { VERDICTS, type Verdict } from "./analysis.ts";
import { checkSceneTimes, checkTimeline } from "./timeline.ts";

/** The four no-ad reasons in precedence order (AD-9); `policy` re-exports them. */
export const REASONS = ["analysisUnavailable", "sensitiveScene", "nothingFits", "noActiveCampaign"] as const;
export type Reason = (typeof REASONS)[number];
export const OUTCOMES = ["ad", ...REASONS] as const;
export type Outcome = (typeof OUTCOMES)[number];
export const SENTIMENTS = [-1, -0.5, 0, 0.5, 1] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export type SimulatedPrice = { cents: Int; simulated: true };
export type SimulatedSplit = { platformCents: Int; publisherCents: Int; simulated: true };
/** A View product click; it lives only in the session (AD-23). */
export type SimulatedClick = { productId: string; simulated: true };
export type Ranked = { productId: string; relevance: Int };
/** A ranked item as stored in `decisions`, with its template reason line (AD-7). */
export type RankedItem = Ranked & { reason: string };
/** Products per scene list (FR-5). */
export const RANKED_MAX = 10;
export type Panel = {
  contextLabel: { primary: string; secondary?: string };
  moodLabel: string;
  sentiment: Sentiment;
  safeTag: Verdict;
};

/** Never carries a scene description or judge reasons (AD-2); `tagline` only when `outcome` is `ad` (AD-7). */
export type DecisionScene = {
  id: string;
  startMs: Int;
  endMs: Int;
  outcome: Outcome;
  topProductId: string | null;
  price: SimulatedPrice | null;
  split: SimulatedSplit | null;
  ranked: RankedItem[];
  panel: Panel;
  tagline?: string;
};

export type Decisions = {
  clipId: string;
  durationMs: Int;
  analysisHash: string;
  thresholdsHash: string;
  campaignsHash: string;
  /** Ranking window from `config/thresholds.json`, copied so `rankAt` reads no config (AD-14, AD-17). */
  holdMs: Int;
  scenes: DecisionScene[];
};

const TOP_KEYS = ["clipId", "durationMs", "analysisHash", "thresholdsHash", "campaignsHash", "holdMs", "scenes"];
const SCENE_KEYS = ["id", "startMs", "endMs", "outcome", "topProductId", "price", "split", "ranked", "panel", "tagline"];

function checkScene(s: Rec, p: string, issues: Issue[]): boolean {
  onlyKeys(s, SCENE_KEYS, p, issues);
  const timesOk = checkSceneTimes(s, p, issues);
  oneOf(s.outcome, OUTCOMES, at(p, "outcome"), issues);
  const ad = s.outcome === "ad";
  // topProductId may be set on any scene; price and split exist only for an ad.
  const nullable = (k: string, check: (v: unknown, path: string) => void, adOnly = true) => {
    if (s[k] === null && !ad) return;
    if (s[k] === null) return void fail(issues, at(p, k), "must not be null when outcome is ad");
    if (adOnly && !ad) return void fail(issues, at(p, k), "must be null unless outcome is ad");
    check(s[k], at(p, k));
  };
  nullable("topProductId", (v, path) => nonEmptyString(v, path, issues), false);
  nullable("price", (v, path) => {
    if (!object(v, path, issues)) return;
    onlyKeys(v, ["cents", "simulated"], path, issues);
    nonNegInt(v.cents, at(path, "cents"), issues);
    literal(v.simulated, true, at(path, "simulated"), issues);
  });
  nullable("split", (v, path) => {
    if (!object(v, path, issues)) return;
    onlyKeys(v, ["platformCents", "publisherCents", "simulated"], path, issues);
    nonNegInt(v.platformCents, at(path, "platformCents"), issues);
    nonNegInt(v.publisherCents, at(path, "publisherCents"), issues);
    literal(v.simulated, true, at(path, "simulated"), issues);
  });
  const price = s.price as Rec | null | undefined, split = s.split as Rec | null | undefined;
  if (ad && object(price, "", []) && object(split, "", []) && [price.cents, split.platformCents, split.publisherCents].every(Number.isSafeInteger)) {
    if ((split.platformCents as number) + (split.publisherCents as number) !== price.cents) fail(issues, at(p, "split"), "must add up to price.cents");
  }
  if (array(s.ranked, at(p, "ranked"), issues)) {
    if (s.ranked.length > RANKED_MAX) fail(issues, at(p, "ranked"), `must hold at most ${RANKED_MAX} products`);
    s.ranked.forEach((r, i) => {
      const rp = at(at(p, "ranked"), i);
      if (!object(r, rp, issues)) return;
      onlyKeys(r, ["productId", "relevance", "reason"], rp, issues);
      nonEmptyString(r.productId, at(rp, "productId"), issues);
      nonEmptyString(r.reason, at(rp, "reason"), issues);
      integer(r.relevance, at(rp, "relevance"), issues, 0, 100);
    });
  }
  if (typeof s.topProductId === "string" && (s.ranked as { productId?: unknown }[] | undefined)?.[0]?.productId !== s.topProductId) {
    fail(issues, at(p, "topProductId"), "must equal ranked[0].productId");
  }
  const pp = at(p, "panel");
  if (object(s.panel, pp, issues)) {
    const panel = s.panel;
    onlyKeys(panel, ["contextLabel", "moodLabel", "sentiment", "safeTag"], pp, issues);
    const cp = at(pp, "contextLabel");
    if (object(panel.contextLabel, cp, issues)) {
      onlyKeys(panel.contextLabel, ["primary", "secondary"], cp, issues);
      nonEmptyString(panel.contextLabel.primary, at(cp, "primary"), issues);
      if (panel.contextLabel.secondary !== undefined) nonEmptyString(panel.contextLabel.secondary, at(cp, "secondary"), issues);
    }
    nonEmptyString(panel.moodLabel, at(pp, "moodLabel"), issues);
    oneOf(panel.sentiment, SENTIMENTS, at(pp, "sentiment"), issues);
    oneOf(panel.safeTag, VERDICTS, at(pp, "safeTag"), issues);
  }
  if (s.tagline !== undefined) {
    if (ad) nonEmptyString(s.tagline, at(p, "tagline"), issues);
    else fail(issues, at(p, "tagline"), "is allowed only when outcome is ad");
  }
  return timesOk;
}

/** Validates parsed `decisions/<clip>.json`; unknown keys are rejected (AD-2, AD-14). */
export function validateDecisions(json: unknown): Result<Decisions> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  onlyKeys(json, TOP_KEYS, "", issues);
  clipId(json.clipId, "clipId", issues);
  let timesOk = integer(json.durationMs, "durationMs", issues, 1);
  integer(json.holdMs, "holdMs", issues, 5000); // same floor as config (AD-17)
  for (const k of ["analysisHash", "thresholdsHash", "campaignsHash"]) nonEmptyString(json[k], k, issues);
  if (array(json.scenes, "scenes", issues)) {
    json.scenes.forEach((s, i) => {
      if (!object(s, at("scenes", i), issues) || !checkScene(s, at("scenes", i), issues)) timesOk = false;
    });
    if (timesOk) issues.push(...checkTimeline(json.scenes as { startMs: number; endMs: number }[], json.durationMs as number));
  }
  return done(issues, () => json as Decisions);
}
