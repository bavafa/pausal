import { REASONS, type DecisionScene, type Decisions, type Reason } from "@pausal/bundle-schema";

/** On `ad` the web reads product, price, split and tagline from `scene`. */
export type PauseResult = { outcome: "ad"; scene: DecisionScene } | { outcome: Reason; scene: DecisionScene | null };

/** A pause also checks every scene that ended less than this long before it (AD-16). */
const LOOK_BACK_MS = 1000;

const indexAt = (decisions: Decisions, tMs: number) => decisions.scenes.findIndex((s) => s.startMs <= tMs && tMs < s.endMs);

/** The scene whose half-open `[startMs, endMs)` holds `tMs`, or null outside the clip. */
export function sceneAt(decisions: Decisions, tMs: number): DecisionScene | null {
  return decisions.scenes[indexAt(decisions, tMs)] ?? null;
}

/**
 * Pause outcome at the displayed-frame time `tMs`. The set is the scene at `tMs` plus every earlier scene with
 * `endMs > tMs - LOOK_BACK_MS` (one ending exactly `LOOK_BACK_MS` before is out). Earlier scenes count only with a safety outcome
 * (sensitive scene or analysis unavailable); a weak fit or missing campaign next door is no risk. An ad (the current scene's product)
 * when nothing in the set blocks; otherwise the first reason in `REASONS` order. Expects validated `decisions`.
 */
export function resolvePause(decisions: Decisions, tMs: number): PauseResult {
  const i = indexAt(decisions, tMs);
  const scene = decisions.scenes[i];
  if (!scene) return { outcome: "analysisUnavailable", scene: null };
  const set = [scene];
  for (let k = i - 1; k >= 0; k--) {
    const prev = decisions.scenes[k]!;
    if (prev.endMs <= tMs - LOOK_BACK_MS) break;
    if (prev.outcome === "sensitiveScene" || prev.outcome === "analysisUnavailable") set.push(prev);
  }
  const reason = REASONS.find((r) => set.some((s) => s.outcome === r));
  if (reason) return { outcome: reason, scene };
  // Nothing blocks, so the current scene's product is shown (ADR 0009, ADR 0011).
  return { outcome: "ad", scene };
}
