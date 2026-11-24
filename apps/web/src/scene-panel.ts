import type { DecisionScene, Verdict } from "@pausall/bundle-schema";

export const SAFE_TEXT: Record<Verdict, string> = { safe: "Brand safe", caution: "Caution", unsafe: "Not brand safe" };

export type ScenePanelView = { kind: "unavailable" } | { kind: "scene"; context: string; mood: string; safe: string };

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Panel text for the current scene, from `panel` only; never a description (AD-2). */
export function scenePanel(scene: DecisionScene | null): ScenePanelView {
  if (!scene || scene.outcome === "analysisUnavailable") return { kind: "unavailable" };
  const { contextLabel, moodLabel, safeTag } = scene.panel;
  const context = capitalize([contextLabel.primary, contextLabel.secondary].filter(Boolean).join(", "));
  return { kind: "scene", context, mood: moodLabel, safe: SAFE_TEXT[safeTag] };
}
