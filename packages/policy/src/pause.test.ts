import { describe, expect, it } from "vitest";
import { validateDecisions, type DecisionScene, type Decisions, type Int, type Outcome } from "@pausal/bundle-schema";
import { resolvePause, sceneAt } from "./index.ts";

type Spec = [startMs: number, endMs: number, outcome: Outcome, productId?: string];

const scene = ([startMs, endMs, outcome, productId = "p1"]: Spec): DecisionScene => {
  const ad = outcome === "ad";
  return {
    id: `s${String(startMs).padStart(7, "0")}`,
    startMs: startMs as Int,
    endMs: endMs as Int,
    outcome,
    topProductId: productId,
    price: ad ? { cents: 100 as Int, simulated: true } : null,
    split: ad ? { platformCents: 70 as Int, publisherCents: 30 as Int, simulated: true } : null,
    ranked: [{ productId, relevance: 70 as Int, reason: "Fits a kitchen scene.", bid: null }],
    panel: { contextLabel: { primary: "kitchen" }, moodLabel: "Neutral", sentiment: 0, safeTag: "safe" },
  };
};

const clip = (...specs: Spec[]): Decisions => {
  const d = {
    clipId: "abc123def456",
    durationMs: specs.at(-1)![1] as Int,
    analysisHash: "a",
    thresholdsHash: "t",
    campaignsHash: "c",
    holdMs: 5000 as Int,
    scenes: specs.map(scene),
  };
  const result = validateDecisions(d);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return d;
};

const at = (d: Decisions, t: number) => {
  const r = resolvePause(d, t);
  return { outcome: r.outcome, sceneId: r.scene?.id ?? null };
};

describe("sceneAt", () => {
  const d = clip([0, 5000, "ad"], [5000, 9000, "ad"]);
  it("uses half-open intervals", () => {
    expect(sceneAt(d, 0)?.id).toBe("s0000000");
    expect(sceneAt(d, 4999)?.id).toBe("s0000000");
    expect(sceneAt(d, 5000)?.id).toBe("s0005000");
    expect(sceneAt(d, 8999)?.id).toBe("s0005000");
    expect(sceneAt(d, 4999.5)?.id).toBe("s0000000");
  });
  it("returns null outside the clip", () => {
    for (const t of [-1, 9000, Number.NaN, Number.POSITIVE_INFINITY]) expect(sceneAt(d, t)).toBeNull();
  });
});

describe("resolvePause boundaries", () => {
  const d = clip([0, 5000, "sensitiveScene"], [5000, 9000, "ad"]);
  it("minus 1 ms is the earlier scene", () => expect(at(d, 4999)).toEqual({ outcome: "sensitiveScene", sceneId: "s0000000" }));
  it("0 ms looks back to the earlier scene", () => expect(at(d, 5000)).toEqual({ outcome: "sensitiveScene", sceneId: "s0005000" }));
  it("plus 999 ms still looks back", () => expect(at(d, 5999)).toEqual({ outcome: "sensitiveScene", sceneId: "s0005000" }));
  it("a fractional time just inside the window still looks back", () => expect(at(d, 5999.9).outcome).toBe("sensitiveScene"));
  it("plus 1000 ms no longer looks back", () => expect(at(d, 6000)).toEqual({ outcome: "ad", sceneId: "s0005000" }));
});

describe("resolvePause", () => {
  it("shows an ad when both scenes are ads for the same product", () => {
    const r = resolvePause(clip([0, 5000, "ad"], [5000, 9000, "ad"]), 5000);
    expect(r.outcome).toBe("ad");
    expect(r.scene?.topProductId).toBe("p1");
  });
  it("lets the lowest reason beat an ad on either side of the boundary", () => {
    expect(at(clip([0, 5000, "ad"], [5000, 9000, "noActiveCampaign"]), 5000).outcome).toBe("noActiveCampaign");
    expect(at(clip([0, 5000, "noActiveCampaign"], [5000, 9000, "ad"]), 5000).outcome).toBe("noActiveCampaign");
  });
  it("returns the first reason in policy order", () => {
    expect(at(clip([0, 5000, "noActiveCampaign"], [5000, 9000, "nothingFits"]), 5000).outcome).toBe("nothingFits");
    expect(at(clip([0, 5000, "analysisUnavailable"], [5000, 9000, "sensitiveScene"]), 5000).outcome).toBe("analysisUnavailable");
  });
  it("shows the current scene's product when the look-back holds ads for other products (ADR 0009)", () => {
    expect(at(clip([0, 5000, "ad", "p2"], [5000, 9000, "ad", "p1"]), 5000)).toEqual({ outcome: "ad", sceneId: "s0005000" });
  });
  it("looks back across a chain of short scenes", () => {
    const d = clip([0, 5000, "sensitiveScene"], [5000, 5300, "ad"], [5300, 9000, "ad"]);
    expect(at(d, 5800)).toEqual({ outcome: "sensitiveScene", sceneId: "s0005300" });
    expect(at(d, 6300).outcome).toBe("ad");
  });
  it("returns analysisUnavailable outside the clip", () => {
    const d = clip([0, 5000, "ad"], [5000, 9000, "ad"]);
    for (const t of [-1, 9000, Number.NaN]) expect(at(d, t)).toEqual({ outcome: "analysisUnavailable", sceneId: null });
  });
  it("returns analysisUnavailable in a pending scene", () => {
    expect(at(clip([0, 5000, "ad"], [5000, 9000, "analysisUnavailable"]), 7000).outcome).toBe("analysisUnavailable");
  });
});
