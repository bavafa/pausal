import type { Int } from "@pausall/bundle-schema";

export type Span = { startMs: Int; endMs: Int };

/**
 * Tiles [0, durationMs) into scenes (AD-21): a cut where consecutive sampled frames differ by at least `threshold`
 * (mean absolute difference, 0 to 1, between frame i-1 and i, cut at frame i's time), at every dialogue change point,
 * and wherever a scene would pass `capMs`. Cuts under `minMs` apart are merged. Times are integer ms.
 */
export function segment(
  frames: readonly { tMs: number; diff: number }[],
  dialogueCutsMs: readonly number[],
  durationMs: number,
  capMs: number,
  threshold: number,
  minMs = 1000,
): Span[] {
  const cuts = new Set<number>();
  for (const f of frames) if (f.diff >= threshold) cuts.add(Math.round(f.tMs));
  for (const t of dialogueCutsMs) cuts.add(Math.round(t));
  // Cuts closer than `minMs` to the previous kept cut or to the end are dropped, so no sliver scenes.
  const sorted = [0];
  for (const t of [...cuts].sort((a, b) => a - b)) if (t - (sorted.at(-1) as number) >= minMs && durationMs - t >= minMs) sorted.push(t);
  sorted.push(durationMs);
  const spans: Span[] = [];
  for (let i = 1; i < sorted.length; i++) {
    let start = sorted[i - 1] as number;
    const end = sorted[i] as number;
    if (end <= start) continue;
    // Split an over-long scene into equal parts no longer than the cap.
    const parts = Math.ceil((end - start) / capMs);
    for (let k = 1; k <= parts; k++) {
      const stop = k === parts ? end : start + Math.round((end - start) / (parts - k + 1));
      spans.push({ startMs: start as Int, endMs: stop as Int });
      start = stop;
    }
  }
  return spans;
}

/** Chunk 1 is the first `chunkMs` (20 s) of the clip (FR-22, AD-13). */
export const chunkOf = (startMs: number, chunkMs: number): Int => (Math.floor(startMs / chunkMs) + 1) as Int;
