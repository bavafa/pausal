import { describe, expect, it } from "vitest";
import { CLIPS, loadDecisions, PRODUCTS } from "./clips.ts";
import { earningsRows, tallyLine } from "./earnings.ts";
import { pauseView } from "./pause-view.ts";
import type { PauseEntry } from "./session.ts";

const decisions = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!);
const pause = (tMs: number, clipId = "000000000001"): PauseEntry => ({ clipId, tMs, view: pauseView(decisions, PRODUCTS, tMs), click: null });
const rows = (log: PauseEntry[]) => earningsRows(log, "000000000001", () => "Other clip");

describe("tallyLine", () => {
  it("has no pauses yet", () => {
    expect(tallyLine([])).toBe("Simulated earnings: no pauses yet");
  });
  it("counts ads shown and held back, a repeat pause counting again", () => {
    expect(tallyLine([pause(2000), pause(7500), pause(2500)])).toBe("Simulated earnings: 2 ads shown ($2.16), 1 held back ($0.00)");
  });
  it("uses the singular for one ad", () => {
    expect(tallyLine([pause(2000)])).toBe("Simulated earnings: 1 ad shown ($1.08), 0 held back ($0.00)");
  });
});

describe("earningsRows", () => {
  it("shows an ad pause with its price and split", () => {
    expect(rows([pause(2000)])).toEqual([{ time: "0:02", clip: null, what: "Ad: Everyday Skillet", figures: "Simulated $1.08 (platform $0.76, publisher $0.32)" }]);
  });
  it("shows a no-ad pause as zero with its reason", () => {
    expect(rows([pause(7500)])).toEqual([{ time: "0:07", clip: null, what: "No ad here: sensitive scene.", figures: "Simulated $0.00 (platform $0.00, publisher $0.00)" }]);
  });
  it("gives one row per pause event and names another clip", () => {
    const r = rows([pause(2000), pause(2500), pause(65000, "other")]);
    expect(r.map((x) => [x.time, x.clip])).toEqual([["0:02", null], ["0:02", null], ["1:05", "Other clip"]]);
  });
});
