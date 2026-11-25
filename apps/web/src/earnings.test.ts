import { describe, expect, it } from "vitest";
import { CLIPS, loadDecisions, PRODUCTS } from "./clips.ts";
import { earningsRows, tallyLine } from "./earnings.ts";
import { pauseView } from "./pause-view.ts";
import type { PauseEntry } from "./session.ts";

const decisions = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!);
const pause = (tMs: number, clipId = "000000000001"): PauseEntry => ({ clipId, tMs, view: pauseView(decisions, PRODUCTS, tMs), click: null });
const rows = (log: PauseEntry[]) => earningsRows(log, "000000000001", () => "Other clip");

const clicked = (e: PauseEntry): PauseEntry => ({ ...e, click: e.view.kind === "ad" ? { productId: e.view.product.id, simulated: true } : null });

describe("tallyLine", () => {
  it("has no pauses yet", () => {
    expect(tallyLine([])).toBe("Simulated earnings: no pauses yet");
  });
  it("earns nothing for ads that were only shown", () => {
    expect(tallyLine([pause(2000), pause(27500), pause(2500)])).toBe("Simulated earnings: $0.00 from 0 clicks · 2 ads shown, 1 held back");
  });
  it("charges a click once per product", () => {
    expect(tallyLine([clicked(pause(2000)), pause(27500), clicked(pause(2500))])).toBe("Simulated earnings: $1.08 from 1 click · 2 ads shown, 1 held back");
  });
});

describe("earningsRows", () => {
  it("shows a clicked ad with its price and split, and a repeat click as not charged", () => {
    expect(rows([clicked(pause(2000)), clicked(pause(2500))]).map((r) => r.figures)).toEqual(["Clicked: simulated $1.08 (platform $0.76, publisher $0.32)", "Clicked again: not charged"]);
  });
  it("shows an ad without a click as free", () => {
    expect(rows([pause(2000)])).toEqual([{ time: "0:02", clip: null, what: "Ad: Everyday Skillet", figures: "Shown, no click: $0.00" }]);
  });
  it("shows a no-ad pause as zero with its reason", () => {
    expect(rows([pause(27500)])).toEqual([{ time: "0:27", clip: null, what: "No ad here: sensitive scene.", figures: "Simulated $0.00" }]);
  });
  it("gives one row per pause event and names another clip", () => {
    const r = rows([pause(2000), pause(2500), pause(65000, "other")]);
    expect(r.map((x) => [x.time, x.clip])).toEqual([["0:02", null], ["0:02", null], ["1:05", "Other clip"]]);
  });
});
