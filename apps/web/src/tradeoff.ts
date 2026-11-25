import type { Decisions, Reason } from "@pausal/bundle-schema";
import { resolvePause } from "@pausal/policy";

export type PauseShares = { pauses: number; ad: number } & Record<Reason, number>;

/** Share (0 to 100) of every outcome when each clip is paused every tenth of a second, the same sweep the safety test uses. */
export function pauseShares(all: readonly Decisions[]): PauseShares {
  const counts: Record<string, number> = { ad: 0 };
  let pauses = 0;
  for (const d of all)
    for (let t = 0; t < d.durationMs; t += 100, pauses++) {
      const o = resolvePause(d, t).outcome;
      counts[o] = (counts[o] ?? 0) + 1;
    }
  const pct = (k: string) => (pauses ? (100 * (counts[k] ?? 0)) / pauses : 0);
  return { pauses, ad: pct("ad"), sensitiveScene: pct("sensitiveScene"), nothingFits: pct("nothingFits"), noActiveCampaign: pct("noActiveCampaign"), analysisUnavailable: pct("analysisUnavailable") };
}

/** One decimal under 10 percent, whole numbers above, so small shares stay visible. */
export const percent = (x: number): string => `${x > 0 && x < 10 ? x.toFixed(1) : Math.round(x)}%`;
