import { array, at, bool, clipId, done, fail, integer, object, oneOf, onlyKeys, type Int, type Issue, type Result } from "./check.ts";
import { CATEGORIES, type Category } from "./config.ts";

/**
 * One human-labeled time range, half-open `[startMs, endMs)`. Labels join to results by time, never by scene ID (AD-10).
 * `topProductFits` is the human judgment of the top product shown there; null when not judged.
 */
export type LabelRange = { startMs: Int; endMs: Int; safe: boolean; categories: Category[]; topProductFits: boolean | null };
export type Labels = { clipId: string; ranges: LabelRange[] };

const RANGE_KEYS = ["startMs", "endMs", "safe", "categories", "topProductFits"];

/** Validates parsed `data/labels/<clip>.json`: sorted ranges with no overlap (gaps are unlabeled time). */
export function validateLabels(json: unknown): Result<Labels> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  onlyKeys(json, ["clipId", "ranges"], "", issues);
  clipId(json.clipId, "clipId", issues);
  if (array(json.ranges, "ranges", issues)) {
    if (json.ranges.length === 0) fail(issues, "ranges", "must hold at least one range");
    let prevEnd = 0;
    json.ranges.forEach((r, i) => {
      const p = at("ranges", i);
      if (!object(r, p, issues)) return;
      onlyKeys(r, RANGE_KEYS, p, issues);
      const start = r.startMs, end = r.endMs;
      if (integer(start, at(p, "startMs"), issues, 0) && integer(end, at(p, "endMs"), issues, 1)) {
        if (end <= start) fail(issues, p, "endMs must be greater than startMs");
        if (start < prevEnd) fail(issues, p, `overlaps or is out of order: starts at ${start}, previous range ends at ${prevEnd}`);
        prevEnd = end;
      }
      const safeOk = bool(r.safe, at(p, "safe"), issues);
      if (array(r.categories, at(p, "categories"), issues)) {
        r.categories.forEach((c, k) => oneOf(c, CATEGORIES, at(at(p, "categories"), k), issues));
        if (safeOk && r.safe && r.categories.length) fail(issues, at(p, "categories"), "must be empty when safe is true");
        if (safeOk && !r.safe && !r.categories.length) fail(issues, at(p, "categories"), "must name at least one category when safe is false");
      }
      if (r.topProductFits !== null) bool(r.topProductFits, at(p, "topProductFits"), issues);
    });
  }
  return done(issues, () => json as Labels);
}

/** `config/eval.json`. The floors keep the guardrail from passing on an empty set (AD-11, AD-20). */
export type EvalConfig = { minUnsafeMs: Int; agreementTargetPercent: Int };

export function validateEvalConfig(json: unknown): Result<EvalConfig> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  onlyKeys(json, ["minUnsafeMs", "agreementTargetPercent"], "", issues);
  integer(json.minUnsafeMs, "minUnsafeMs", issues, 1000);
  integer(json.agreementTargetPercent, "agreementTargetPercent", issues, 50, 100);
  return done(issues, () => json as EvalConfig);
}
