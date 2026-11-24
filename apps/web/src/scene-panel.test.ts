import { describe, expect, it } from "vitest";
import { sceneAt } from "@pausal/policy";
import { CLIPS, loadDecisions } from "./clips.ts";
import { scenePanel } from "./scene-panel.ts";

const decisions = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!)!;
const at = (tMs: number) => scenePanel(sceneAt(decisions, tMs));

describe("scenePanel on the fixture", () => {
  it("joins primary and secondary and capitalizes", () => expect(at(2500)).toEqual({ kind: "scene", context: "Kitchen, cooking", mood: "Relaxed", safe: "Brand safe" }));
  it("shows an unsafe scene", () => expect(at(7500)).toMatchObject({ context: "Kitchen, fight or conflict", mood: "Tense", safe: "Not brand safe" }));
  it("shows primary only", () => expect(at(12500)).toMatchObject({ context: "Beach" }));
  it("shows caution", () => {
    const s = structuredClone(sceneAt(decisions, 2500)!);
    s.panel.safeTag = "caution";
    expect(scenePanel(s)).toMatchObject({ safe: "Caution" });
  });
  it("is unavailable for an analysisUnavailable scene, outside the clip or with no scene", () => {
    expect(at(22500)).toEqual({ kind: "unavailable" });
    expect(at(decisions.durationMs)).toEqual({ kind: "unavailable" });
    expect(scenePanel(null)).toEqual({ kind: "unavailable" });
  });
});
