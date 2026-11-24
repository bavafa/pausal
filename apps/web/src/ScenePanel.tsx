import type { DecisionScene } from "@pausall/bundle-schema";
import { scenePanel } from "./scene-panel.ts";

const KEY = "mr-1.5 text-eyebrow uppercase tracking-[0.08em] text-muted-foreground";

/** Slim strip under the video. Not a live region: values are read on demand (EXPERIENCE accessibility). */
export function ScenePanel({ scene }: { scene: DecisionScene | null }) {
  const view = scenePanel(scene);
  return (
    <section aria-label="Scene panel" className="border-b border-border py-3">
      {view.kind === "unavailable" ? (
        <p className="text-muted-foreground">Analysis unavailable for this scene.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
            <p>
              <span className={KEY}>Scene</span> {view.context}
            </p>
            <p>
              <span className={KEY}>Sentiment</span> {view.mood}
            </p>
            <span className="rounded-full border border-accent px-2 py-0.5 text-label text-accent">{view.safe}</span>
          </div>
          <p className="mt-1 text-label text-muted-foreground">Based on this scene and the previous 3</p>
        </>
      )}
    </section>
  );
}
