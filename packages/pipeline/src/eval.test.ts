import { describe, expect, it } from "vitest";
import { validateDecisions, validateEvalConfig, validateLabels, type Decisions, type Labels, type Result } from "@pausal/bundle-schema";
import decisionsJson from "../../../data/decisions/000000000001.json" with { type: "json" };
import labelsJson from "../../../data/labels/000000000001.json" with { type: "json" };
import { evaluate, report, sweepTimes } from "./eval.ts";

const ok = <T>(r: Result<T>): T => (r.ok ? r.value : expect.fail(JSON.stringify(r.issues)));
const decisions = ok(validateDecisions(decisionsJson));
const cfg = { minUnsafeMs: 5000, agreementTargetPercent: 80 } as const;
const labels = (mutate: (l: Labels) => void = () => {}): Labels => {
  const l = structuredClone(labelsJson) as Labels;
  mutate(l);
  return ok(validateLabels(l));
};
const run = (l: Labels, d: Decisions | null = decisions) => evaluate([{ clipId: l.clipId, labels: l, decisions: d, analysis: null }], cfg as never);

describe("sweepTimes", () => {
  it("covers 100 ms steps and each boundary at -1, 0 and +1000 ms", () => {
    const t = sweepTimes(decisions);
    expect(t[0]).toBe(0);
    expect(t.at(-1)).toBe(34900);
    for (const ms of [4999, 5000, 6000, 29999, 30000, 31000, 34900]) expect(t).toContain(ms);
    expect(new Set(t).size).toBe(t.length);
  });
});

describe("evaluate on the fixture", () => {
  it("reports the ad on the violent scene only one judge calls unsafe (ADR 0009)", () => {
    const r = run(labels());
    expect(r.guardrail.pass).toBe(false);
    expect(r.unsafeAds).toBeGreaterThan(0);
    expect(r.joinedUnsafeSamples).toBeGreaterThan(0);
    expect(r.failures.map((f) => f.kind)).toEqual(["unsafe ad", "unexpected no-ad", "unexpected no-ad"]);
  });

  it("fails when an ad lands on a labeled unsafe time", () => {
    const r = run(labels((l) => Object.assign(l.ranges[0]!, { safe: false, categories: ["violence"], topProductFits: null })));
    expect(r.guardrail.pass).toBe(false);
    expect(r.unsafeAds).toBeGreaterThan(0);
    expect(r.failures[0]).toMatchObject({ kind: "unsafe ad", startMs: 0, endMs: 5000 });
  });

  it('fails on "0 ads in 0 joined unsafe scenes"', () => {
    const allSafe = labels((l) => l.ranges.forEach((r) => Object.assign(r, { safe: true, categories: [] })));
    const r = run(allSafe);
    expect(r.unsafeAds).toBe(0);
    expect(r.guardrail.pass).toBe(false);
    expect(r.guardrail.problems).toContain("0 ads in 0 joined unsafe pause times: the check had nothing to check");
  });

  it("fails when a labeled range has no coverage in decisions", () => {
    expect(run(labels((l) => l.ranges.push({ startMs: 35000, endMs: 36000, safe: true, categories: [], topProductFits: null } as never))).guardrail.problems[0]).toMatch(/ends after the clip/);
    expect(run(labels(), null).guardrail.problems[0]).toMatch(/no decisions file/);
  });

  it("fails when unsafe time is below the minimum or a category has no labels", () => {
    const r = run(labels((l) => { l.ranges[5]!.safe = true; l.ranges[5]!.categories = []; l.ranges[1]!.endMs = 9000 as never; }));
    expect(r.guardrail.problems).toEqual(expect.arrayContaining([expect.stringMatching(/below the minimum/), "category sexual has no labeled range"]));
  });

  it("writes the same report for the same inputs, with no em dash", () => {
    const a = report(run(labels()));
    expect(report(run(labels()))).toBe(a);
    expect(a).not.toMatch(/—/);
  });
});

describe("label and eval config schemas", () => {
  it("rejects overlapping ranges and categories on a safe range", () => {
    const bad = validateLabels({ clipId: "ab", ranges: [{ startMs: 0, endMs: 10, safe: true, categories: ["violence"], topProductFits: null }, { startMs: 5, endMs: 20, safe: false, categories: [], topProductFits: true }] });
    expect(bad.ok ? [] : bad.issues.map((i) => i.path)).toEqual(["ranges[0].categories", "ranges[1]", "ranges[1].categories"]);
  });

  it("keeps the unsafe-time floor", () => {
    expect(validateEvalConfig({ minUnsafeMs: 0, agreementTargetPercent: 80 }).ok).toBe(false);
  });
});
