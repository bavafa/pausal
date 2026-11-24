import { describe, expect, it } from "vitest";
import { validateDecisions, type DecisionScene, type Decisions, type Int, type Outcome, type Verdict } from "@pausall/bundle-schema";
import { rankAt, resolvePause, type Held } from "./index.ts";

type Spec = { end: number; ids: string[]; outcome?: Outcome; safeTag?: Verdict };

/** Scenes back to back from 0; each ranks `ids` in order with falling relevance. */
const clip = (...specs: Spec[]): Decisions => {
  let start = 0;
  const scenes = specs.map(({ end, ids, outcome = "ad", safeTag = "safe" }): DecisionScene => {
    const ad = outcome === "ad";
    const s: DecisionScene = {
      id: `s${String(start).padStart(7, "0")}`,
      startMs: start as Int,
      endMs: end as Int,
      outcome,
      topProductId: ids[0] ?? null,
      price: ad ? { cents: 100 as Int, simulated: true } : null,
      split: ad ? { platformCents: 70 as Int, publisherCents: 30 as Int, simulated: true } : null,
      ranked: ids.map((productId, i) => ({ productId, relevance: (90 - i) as Int, reason: `r-${productId}-${start}`, bid: null })),
      panel: { contextLabel: { primary: "kitchen" }, moodLabel: "Neutral", sentiment: 0, safeTag },
    };
    start = end;
    return s;
  });
  const d = { clipId: "abc123def456", durationMs: start as Int, analysisHash: "a", thresholdsHash: "t", campaignsHash: "c", holdMs: 5000 as Int, scenes };
  const result = validateDecisions(d);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return d;
};

const ids = (d: Decisions, t: number, held: Held | null) => rankAt(d, t, held).ranked.map((r) => r.productId);
const A: Held = { sceneId: "s0000000", productId: "a", sinceMs: 1000 };

describe("rankAt", () => {
  const d = clip({ end: 4000, ids: ["a", "b"] }, { end: 20000, ids: ["b", "a", "c"] });

  it("starts a hold at the scene top when nothing is held", () => {
    expect(rankAt(d, 1000, null)).toMatchObject({ held: A, ranked: [{ productId: "a" }, { productId: "b" }] });
  });
  it("keeps sinceMs while the same product stays top", () => {
    const same = clip({ end: 4000, ids: ["a"] }, { end: 9000, ids: ["a", "b"] });
    expect(rankAt(same, 4500, A).held).toEqual({ sceneId: "s0004000", productId: "a", sinceMs: 1000 });
  });
  it("holds the previous top within holdMs, with this scene's relevance and reason", () => {
    const v = rankAt(d, 5999, A);
    expect(v.ranked.map((r) => [r.productId, r.reason])).toEqual([["a", "r-a-4000"], ["b", "r-b-4000"], ["c", "r-c-4000"]]);
    expect(v.held).toBe(A);
  });
  it("releases at holdMs", () => {
    expect(ids(d, 6000, A)).toEqual(["b", "a", "c"]);
    expect(rankAt(d, 6000, A).held).toEqual({ sceneId: "s0004000", productId: "b", sinceMs: 6000 });
  });
  it("releases at once when the outcome changes", () => {
    const changed = clip({ end: 4000, ids: ["a"] }, { end: 9000, ids: ["b", "a"], outcome: "noActiveCampaign" });
    expect(ids(changed, 4500, A)).toEqual(["b", "a"]);
  });
  it("releases at once when the safe tag gets worse", () => {
    const flagged = clip({ end: 4000, ids: ["a"] }, { end: 9000, ids: ["b", "a"], safeTag: "caution" });
    expect(ids(flagged, 4500, A)).toEqual(["b", "a"]);
  });
  it("releases when the held product is not ranked here, on a seek back, or for an unknown scene", () => {
    expect(ids(d, 4500, { ...A, productId: "z" })).toEqual(["b", "a", "c"]);
    expect(ids(d, 4500, { ...A, sinceMs: 4600 })).toEqual(["b", "a", "c"]);
    expect(ids(d, 4500, { ...A, sceneId: "nope" })).toEqual(["b", "a", "c"]);
  });
  it("is empty outside the clip or for an empty list", () => {
    expect(rankAt(d, 20000, A)).toEqual({ scene: null, ranked: [], held: null });
    const empty = clip({ end: 4000, ids: [], outcome: "nothingFits" });
    expect(rankAt(empty, 100, A)).toMatchObject({ ranked: [], held: null });
  });
  it("never changes what resolvePause returns", () => {
    const times = [0, 3999, 4000, 4999, 5000, 12000];
    const before = times.map((t) => resolvePause(d, t));
    for (const t of times) rankAt(d, t, A);
    expect(times.map((t) => resolvePause(d, t))).toEqual(before);
  });
});
