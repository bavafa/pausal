import { CATEGORIES, type Analysis, type Category, type Decisions, type EvalConfig, type LabelRange, type Labels, type Outcome } from "@pausall/bundle-schema";
import { rankAt, resolvePause, type Held } from "@pausall/policy";

/** AD-3: the sweep step, and the offsets checked around every scene boundary. */
export const STEP_MS = 100;
const BOUNDARY_OFFSETS = [-1, 0, 1000];

export type EvalClip = { clipId: string; labels: Labels; decisions: Decisions | null; analysis: Analysis | null };
export type Sample = { tMs: number; outcome: Outcome; topProductId: string | null; range: LabelRange | null };
export type FailureKind = "unsafe ad" | "unexpected ad" | "unexpected no-ad" | "disagreement";
export type Failure = { clipId: string; kind: FailureKind; startMs: number; endMs: number; reason: string };

/** Every pause time the eval checks: 0 to the duration in 100 ms steps, plus each scene boundary at -1, 0 and +1000 ms. */
export function sweepTimes(d: Decisions): number[] {
  const t = new Set<number>();
  for (let ms = 0; ms < d.durationMs; ms += STEP_MS) t.add(ms);
  for (const s of d.scenes) if (s.startMs > 0) for (const o of BOUNDARY_OFFSETS) t.add(s.startMs + o);
  return [...t].filter((ms) => ms >= 0 && ms < d.durationMs).sort((a, b) => a - b);
}

const rangeAt = (labels: Labels, tMs: number): LabelRange | null => labels.ranges.find((r) => r.startMs <= tMs && tMs < r.endMs) ?? null;

/** Runs the shipped `resolvePause` at every sweep time and joins each result to the label range holding that time. */
export function sweep(d: Decisions, labels: Labels): Sample[] {
  return sweepTimes(d).map((tMs) => {
    const r = resolvePause(d, tMs);
    return { tMs, outcome: r.outcome, topProductId: r.scene?.topProductId ?? null, range: rangeAt(labels, tMs) };
  });
}

/** The system's fit answer: an ad or a campaign-less top product says it fits, "nothing fits" says it does not. */
const systemFits = (o: Outcome): boolean | null => (o === "ad" || o === "noActiveCampaign" ? true : o === "nothingFits" ? false : null);

function classify(s: Sample): FailureKind | null {
  const r = s.range;
  if (!r) return null;
  if (!r.safe) return s.outcome === "ad" ? "unsafe ad" : null;
  if (r.topProductFits === false && s.outcome === "ad") return "unexpected ad";
  if (r.topProductFits === true && ["sensitiveScene", "nothingFits", "analysisUnavailable"].includes(s.outcome)) return "unexpected no-ad";
  const sys = systemFits(s.outcome);
  if (r.topProductFits !== null && sys !== null && sys !== r.topProductFits) return "disagreement";
  return null;
}

/** Consecutive failing samples of one kind and outcome in one label range become one listed failure. */
function failures(clipId: string, samples: Sample[], durationMs: number): Failure[] {
  const out: Failure[] = [];
  samples.forEach((s, i) => {
    const kind = classify(s);
    const end = samples[i + 1]?.tMs ?? durationMs;
    const reason = `${s.outcome}${s.topProductId ? ` (${s.topProductId})` : ""}`;
    const last = out.at(-1);
    const prev = samples[i - 1];
    if (kind && last && prev && classify(prev) === kind && prev.range === s.range && last.reason === reason && last.endMs === s.tMs) last.endMs = end;
    else if (kind) out.push({ clipId, kind, startMs: s.tMs, endMs: end, reason });
  });
  return out;
}

/** Times the shown list order changes during straight playback, with the ranking window carried like the web does. */
export function reorders(d: Decisions): number {
  let held: Held | null = null;
  let prev: string | null = null;
  let n = 0;
  for (let t = 0; t < d.durationMs; t += STEP_MS) {
    const v = rankAt(d, t, held);
    held = v.held;
    const order = v.ranked.length ? v.ranked.map((r) => r.productId).join(",") : null;
    if (order && prev && order !== prev) n++;
    if (order) prev = order;
  }
  return n;
}

export type CategoryCoverage = { category: Category; ranges: number; labeledMs: number; ads: number };
export type EvalResult = {
  clips: string[];
  guardrail: { pass: boolean; problems: string[] };
  unsafeAds: number;
  joinedUnsafeSamples: number;
  labeledUnsafeMs: number;
  agreement: { compared: number; matched: number; percent: number | null; target: number };
  noAdShare: number;
  reordersPerMinute: number;
  costPerClipMinuteUsd: number | null;
  costClips: number;
  categories: CategoryCoverage[];
  failures: Failure[];
  shortUnsafe: { clipId: string; startMs: number; endMs: number; ads: number }[];
};

/** Ranges shorter than this are "short events" for the 1 fps check (frames are sampled once per second). */
const SHORT_MS = 2000;

export function evaluate(clips: EvalClip[], cfg: EvalConfig): EvalResult {
  const problems: string[] = [];
  const all: Sample[] = [];
  const fails: Failure[] = [];
  const shortUnsafe: EvalResult["shortUnsafe"] = [];
  const categories = CATEGORIES.map((category) => ({ category, ranges: 0, labeledMs: 0, ads: 0 }));
  let labeledUnsafeMs = 0, minutes = 0, reorderCount = 0, cost = 0, costMinutes = 0, costClips = 0;

  for (const c of clips) {
    for (const r of c.labels.ranges) {
      if (r.safe) continue;
      labeledUnsafeMs += r.endMs - r.startMs;
      for (const cat of r.categories) {
        const cc = categories.find((x) => x.category === cat)!;
        cc.ranges++;
        cc.labeledMs += r.endMs - r.startMs;
      }
    }
    const d = c.decisions;
    if (!d) {
      problems.push(`${c.clipId}: labels have no decisions file, so no labeled range is covered`);
      continue;
    }
    const samples = sweep(d, c.labels);
    for (const r of c.labels.ranges) {
      const where = `${c.clipId} ${fmt(r.startMs)} to ${fmt(r.endMs)}`;
      if (r.endMs > d.durationMs) problems.push(`${where}: ends after the clip (${fmt(d.durationMs)}), so part of it has no coverage in decisions`);
      else if (!samples.some((s) => s.range === r)) problems.push(`${where}: no sweep time falls in this range`);
      const ads = samples.filter((s) => s.range === r && s.outcome === "ad").length;
      if (!r.safe) for (const cat of r.categories) categories.find((x) => x.category === cat)!.ads += ads;
      if (!r.safe && r.endMs - r.startMs < SHORT_MS) shortUnsafe.push({ clipId: c.clipId, startMs: r.startMs, endMs: r.endMs, ads });
    }
    all.push(...samples);
    fails.push(...failures(c.clipId, samples, d.durationMs));
    const clipMinutes = d.durationMs / 60000;
    minutes += clipMinutes;
    reorderCount += reorders(d);
    const usage = c.analysis?.usage;
    if (usage) {
      cost += Object.values(usage).reduce((s, u) => s + u.costUsd, 0);
      costMinutes += clipMinutes;
      costClips++;
    }
  }

  const unsafe = all.filter((s) => s.range && !s.range.safe);
  const unsafeAds = unsafe.filter((s) => s.outcome === "ad").length;
  if (unsafeAds) problems.push(`${unsafeAds} pause time(s) labeled unsafe resolve to an ad`);
  if (unsafe.length === 0) problems.push(`${unsafeAds} ads in 0 joined unsafe pause times: the check had nothing to check`);
  if (labeledUnsafeMs < cfg.minUnsafeMs) problems.push(`labeled unsafe time is ${labeledUnsafeMs} ms, below the minimum of ${cfg.minUnsafeMs} ms in config/eval.json`);
  for (const c of categories) if (c.ranges === 0) problems.push(`category ${c.category} has no labeled range`);

  const compared = all.filter((s) => s.range?.safe && s.range.topProductFits !== null && systemFits(s.outcome) !== null);
  const matched = compared.filter((s) => systemFits(s.outcome) === s.range!.topProductFits).length;

  return {
    clips: clips.map((c) => c.clipId),
    guardrail: { pass: problems.length === 0, problems },
    unsafeAds,
    joinedUnsafeSamples: unsafe.length,
    labeledUnsafeMs,
    agreement: { compared: compared.length, matched, percent: compared.length ? (100 * matched) / compared.length : null, target: cfg.agreementTargetPercent },
    noAdShare: all.length ? all.filter((s) => s.outcome !== "ad").length / all.length : 0,
    reordersPerMinute: minutes ? reorderCount / minutes : 0,
    costPerClipMinuteUsd: costMinutes ? cost / costMinutes : null,
    costClips,
    categories,
    failures: fails,
    shortUnsafe,
  };
}

/** `m:ss.s`, the way a person reads a video time. */
export function fmt(ms: number): string {
  const m = Math.floor(ms / 60000);
  return `${m}:${((ms % 60000) / 1000).toFixed(1).padStart(4, "0")}`;
}

const pct = (x: number): string => `${x.toFixed(1)} percent`;

/** The `docs/eval/report.md` text. No timestamps, so the same inputs give the same bytes. */
export function report(r: EvalResult): string {
  const a = r.agreement;
  const lines = [
    "# Evaluation report",
    "",
    "Written by `pnpm eval`. Every pause time from 0 to the end of each clip in 100 ms steps, plus every scene boundary at minus 1 ms, 0 ms and plus 1000 ms, goes through the same `resolvePause` the app calls. Results join to the labels in `data/labels/` by time, never by scene ID.",
    "",
    `Clips: ${r.clips.map((c) => `\`${c}\``).join(", ") || "none"}.`,
    ...(r.clips.includes("000000000001") ? ["", "Clip `000000000001` is the hand-made fixture. Its labels are test data written to exercise every path, not a measurement of the models."] : []),
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "|---|---|",
    `| Guardrail | ${r.guardrail.pass ? "pass" : "FAIL"} |`,
    `| Ads on labeled unsafe pause times | ${r.unsafeAds} of ${r.joinedUnsafeSamples} |`,
    `| Labeled unsafe time | ${(r.labeledUnsafeMs / 1000).toFixed(1)} s |`,
    `| Agreement on top-product fit | ${a.percent === null ? "no labeled fit to compare" : `${pct(a.percent)} (${a.matched} of ${a.compared} pause times), target ${a.target} percent: ${a.percent >= a.target ? "met" : "not met"}`} |`,
    `| No-ad share | ${pct(100 * r.noAdShare)} of all pause times |`,
    `| List stability | ${r.reordersPerMinute.toFixed(2)} reorders per minute |`,
    `| Cost per clip minute | ${r.costPerClipMinuteUsd === null ? "not recorded (no analysis file carries usage yet)" : `$${r.costPerClipMinuteUsd.toFixed(4)} over ${r.costClips} clip(s)`} |`,
    "",
    "## Guardrail",
    "",
    ...(r.guardrail.pass ? ["Pass. No ad lands on a labeled unsafe time, every labeled range is covered, and every category has labeled scenes."] : r.guardrail.problems.map((p) => `- ${p}`)),
    "",
    "## Coverage by sensitive category",
    "",
    "| Category | Labeled ranges | Labeled time | Ads in those ranges |",
    "|---|---|---|---|",
    ...r.categories.map((c) => `| ${c.category} | ${c.ranges} | ${(c.labeledMs / 1000).toFixed(1)} s | ${c.ads} |`),
    "",
    "## Failures",
    "",
    "An unsafe ad is an ad on time labeled unsafe. An unexpected ad is an ad where the label says the top product does not fit. An unexpected no-ad is a held-back ad (sensitive, nothing fits or analysis unavailable) where the label says the scene is safe and the product fits. A disagreement is any other mismatch on fit.",
    "",
    ...(r.failures.length
      ? ["| Clip | Time | Kind | What the app did |", "|---|---|---|---|", ...r.failures.map((f) => `| \`${f.clipId}\` | ${fmt(f.startMs)} to ${fmt(f.endMs)} | ${f.kind} | ${f.reason} |`)]
      : ["None."]),
    "",
    "## Short events and 1 fps sampling",
    "",
    "The pipeline looks at one frame per second, so an event shorter than about a second can fall between frames.",
    "",
    ...(r.shortUnsafe.length
      ? r.shortUnsafe.map((s) => `- \`${s.clipId}\` ${fmt(s.startMs)} to ${fmt(s.endMs)}: ${s.ads ? `missed, ${s.ads} pause time(s) got an ad` : "caught, no ad"}`)
      : ["The labeled set has no unsafe range shorter than 2 s, so it cannot show yet whether 1 fps sampling misses short events."]),
    "",
  ];
  return lines.join("\n");
}
