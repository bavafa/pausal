import { VERDICTS, type DecisionScene, type Decisions, type RankedItem } from "@pausal/bundle-schema";
import { sceneAt } from "./pause.ts";

/** The top product the web is showing, the scene it came from and when it started showing. Display only (AD-17). */
export type Held = { sceneId: string; productId: string; sinceMs: number };
export type RankView = { scene: DecisionScene | null; ranked: RankedItem[]; held: Held | null };

/**
 * The list to show at `tMs`. Across a scene change the previously held top stays first while it has shown for less
 * than `decisions.holdMs`, the outcome is unchanged, the safe tag is no worse and the product is still ranked here.
 * Never affects `resolvePause`, which ignores `held`.
 */
export function rankAt(decisions: Decisions, tMs: number, held: Held | null): RankView {
  const scene = sceneAt(decisions, tMs);
  const top = scene?.ranked[0];
  if (!scene || !top) return { scene, ranked: [], held: null };
  if (held && held.productId !== top.productId) {
    const from = decisions.scenes.find((s) => s.id === held.sceneId);
    const age = tMs - held.sinceMs;
    const item = scene.ranked.find((r) => r.productId === held.productId);
    const keep =
      from &&
      item &&
      age >= 0 &&
      age < decisions.holdMs &&
      from.outcome === scene.outcome &&
      VERDICTS.indexOf(scene.panel.safeTag) <= VERDICTS.indexOf(from.panel.safeTag);
    if (keep) return { scene, ranked: [item, ...scene.ranked.filter((r) => r !== item)], held };
  }
  const sinceMs = held?.productId === top.productId && tMs >= held.sinceMs ? held.sinceMs : tMs;
  return { scene, ranked: scene.ranked, held: { sceneId: scene.id, productId: top.productId, sinceMs } };
}
