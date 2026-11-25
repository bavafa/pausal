import { describe, expect, it } from "vitest";
import { CLIPS, loadDecisions } from "./clips.ts";
import { pauseShares, percent } from "./tradeoff.ts";

describe("pauseShares", () => {
  it("splits every tenth-of-a-second pause into outcomes that add up to 100", () => {
    const d = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!)!;
    const s = pauseShares([d]);
    expect(s.pauses).toBe(d.durationMs / 100);
    expect(s.ad + s.sensitiveScene + s.nothingFits + s.noActiveCampaign + s.analysisUnavailable).toBeCloseTo(100);
    expect(s.ad).toBeGreaterThan(0);
  });
  it("has no pauses for no clips", () => {
    expect(pauseShares([]).pauses).toBe(0);
  });
});

describe("percent", () => {
  it("keeps one decimal below 10 and rounds above", () => {
    expect([percent(5.55), percent(0), percent(85.6), percent(100)]).toEqual(["5.5%", "0%", "86%", "100%"]);
  });
});
