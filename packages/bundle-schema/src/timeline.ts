import { at, fail, integer, type Int, type Issue, type Rec } from "./check.ts";

/** Scene ID is `s` plus `startMs` zero-padded to 7 digits (AD-10). */
export const sceneId = (startMs: number): string => `s${String(startMs).padStart(7, "0")}`;

/** Checks `id`, `startMs` and `endMs` of one scene; true when all three are valid. */
export function checkSceneTimes(s: Rec, path: string, issues: Issue[]): s is Rec & { id: string; startMs: Int; endMs: Int } {
  const start = integer(s.startMs, at(path, "startMs"), issues, 0, 9_999_999); // keeps sceneId at 7 digits
  const end = integer(s.endMs, at(path, "endMs"), issues, 1);
  if (!start) return false;
  if (s.id !== sceneId(s.startMs as number)) return fail(issues, at(path, "id"), `must be "${sceneId(s.startMs as number)}"`);
  return end;
}

/** Scenes sorted, half-open and tiling [0, durationMs) with no gap or overlap (AD-16). */
export function checkTimeline(scenes: readonly { startMs: number; endMs: number }[], durationMs: number, path = "scenes"): Issue[] {
  const issues: Issue[] = [];
  if (scenes.length === 0) fail(issues, path, `must tile [0, ${durationMs})`);
  let expected = 0;
  scenes.forEach((s, i) => {
    const p = at(path, i);
    if (s.endMs <= s.startMs) fail(issues, p, "endMs must be greater than startMs");
    if (s.startMs < expected) fail(issues, p, `overlaps or is out of order: starts at ${s.startMs}, expected ${expected}`);
    if (s.startMs > expected) fail(issues, p, `leaves a gap: starts at ${s.startMs}, expected ${expected}`);
    expected = s.endMs;
  });
  if (scenes.length && expected !== durationMs) fail(issues, at(path, scenes.length - 1), `must end at durationMs ${durationMs}, ends at ${expected}`);
  return issues;
}
