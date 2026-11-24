import { describe, expect, it } from "vitest";
import { CLIPS, loadDecisions, PRODUCTS } from "./clips.ts";
import { announce, pauseView } from "./pause-view.ts";

const decisions = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!);
const at = (tMs: number) => pauseView(decisions, PRODUCTS, tMs);

describe("pauseView on the fixture", () => {
  it("shows the ad card in an ad scene", () => {
    const v = at(2500);
    expect(v).toMatchObject({ kind: "ad", tagline: "A steady pan for weeknight cooking.", because: "Shown because this scene matches: kitchen, cooking." });
    expect(v.kind === "ad" && v.product.name).toBe("Everyday Skillet");
    expect(v).toMatchObject({ price: { cents: 108, simulated: true }, split: { platformCents: 76, publisherCents: 32, simulated: true } });
  });
  it.each([
    [7500, "No ad here: sensitive scene."],
    [12500, "No ad here: nothing fits well."],
    [17500, "No ad here: no active campaign."],
    [22500, "No ad here: analysis unavailable."],
    [27500, "No ad here: sensitive scene."],
    [30500, "No ad here: sensitive scene."],
    [35000, "No ad here: analysis unavailable."],
  ])("at %i ms shows %s", (t, text) => {
    expect(at(t)).toMatchObject({ kind: "note", text });
  });
  it("falls back to the product name when the tagline failed its check", () => {
    expect(at(34000)).toMatchObject({ kind: "ad", tagline: "Everyday Skillet", because: "Shown because this scene matches: cooking." });
  });
  it("announces the overlay text", () => {
    expect(announce(at(7500))).toBe("Paused. No ad here: sensitive scene.");
    expect(announce(at(2500))).toBe("Paused. Sponsored, simulated ad: Everyday Skillet. A steady pan for weeknight cooking.");
  });
});

describe("pauseView fails closed", () => {
  it("without decisions", () => {
    expect(pauseView(null, PRODUCTS, 2500)).toMatchObject({ kind: "note", reason: "analysisUnavailable" });
  });
  it("when an ad scene has no price", () => {
    const scenes = decisions!.scenes.map((s) => (s.outcome === "ad" ? { ...s, price: null } : s));
    expect(pauseView({ ...decisions!, scenes }, PRODUCTS, 2500)).toMatchObject({ kind: "note", reason: "analysisUnavailable" });
  });
  it("when the ad product has no product file", () => {
    expect(pauseView(decisions, new Map(), 2500)).toMatchObject({ kind: "note", reason: "analysisUnavailable" });
  });
});
