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
 * `endMs > tMs - LOOK_BACK_MS` (one ending exactly `LOOK_BACK_MS` before is out). An ad only when every scene
 * in the set is an ad for the same product; otherwise the first reason in `REASONS` order. Expects validated `decisions`.
 */
export function resolvePause(decisions: Decisions, tMs: number): PauseResult {
  const i = indexAt(decisions, tMs);
  const scene = decisions.scenes[i];
  if (!scene) return { outcome: "analysisUnavailable", scene: null };
  const set = [scene];
  for (let k = i - 1; k >= 0; k--) {
    const prev = decisions.scenes[k]!;
    if (prev.endMs <= tMs - LOOK_BACK_MS) break;
    set.push(prev);
  }
  const reason = REASONS.find((r) => set.some((s) => s.outcome === r));
  if (reason) return { outcome: reason, scene };
  // Every scene is an ad; different products mean no single product fits the moment.
  if (set.some((s) => s.topProductId !== scene.topProductId)) return { outcome: "nothingFits", scene };
  return { outcome: "ad", scene };
}
