import { describe, expect, it } from "vitest";
import { clickFor } from "@pausall/policy";
import { withClick, type PauseEntry } from "./session.ts";

const entry = (tMs: number): PauseEntry => ({ clipId: "c", tMs, view: { kind: "note", reason: "nothingFits", text: "x" }, click: null });

describe("withClick", () => {
  it("sets the click on the latest pause only", () => {
    const log = [entry(1), entry(2)];
    const next = withClick(log, clickFor("p"));
    expect(next.map((e) => e.click)).toEqual([null, { productId: "p", simulated: true }]);
    expect(log[1]!.click).toBeNull();
  });
  it("leaves an empty log unchanged", () => {
    expect(withClick([], clickFor("p"))).toEqual([]);
  });
});
