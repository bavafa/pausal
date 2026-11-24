import { useCallback, useEffect, useRef, useState } from "react";
import type { Decisions, Manifest } from "@pausall/bundle-schema";
import { assetUrl, PRODUCTS } from "./clips.ts";
import { PauseOverlay } from "./PauseOverlay.tsx";
import { announce, pauseView, type PauseView } from "./pause-view.ts";

const toggle = (v: HTMLVideoElement) => void (v.paused ? v.play().catch(() => {}) : v.pause());

/** Elements that handle Space themselves; the page shortcut stays out of their way. */
const OWNS_SPACE = "a, button, input, textarea, select, video, [contenteditable]";

export function WatchScreen({ clip, decisions }: { clip: Manifest; decisions: Decisions | null }) {
  const video = useRef<HTMLVideoElement>(null);
  /** Media time (ms) of the last presented frame from requestVideoFrameCallback; null when unknown. */
  const frameMs = useRef<number | null>(null);
  const [view, setView] = useState<PauseView | null>(null);
  const open = useRef(false);
  open.current = view !== null;

  // Only a pause opens the view (not a fresh load). Never an overlay while playing or after the clip ended.
  const showPause = useCallback(() => {
    const v = video.current;
    if (!v || !v.paused || v.ended) return setView(null);
    setView(pauseView(decisions, PRODUCTS, Math.floor(frameMs.current ?? v.currentTime * 1000)));
  }, [decisions]);

  useEffect(() => {
    const v = video.current;
    if (!v || !("requestVideoFrameCallback" in v)) return;
    let id = 0;
    const onFrame: VideoFrameRequestCallback = (_now, meta) => {
      frameMs.current = meta.mediaTime * 1000;
      if (v.paused && open.current) showPause(); // a seek during the pause view presents a new frame
      id = v.requestVideoFrameCallback(onFrame);
    };
    id = v.requestVideoFrameCallback(onFrame);
    return () => v.cancelVideoFrameCallback(id);
  }, [showPause]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v || e.repeat) return;
      if (e.key === "Escape" && open.current) return void v.play().catch(() => {});
      if (e.key !== " ") return;
      if (e.target instanceof Element && e.target.closest(OWNS_SPACE)) return;
      e.preventDefault();
      toggle(v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!decisions) return;
    const ids = new Set(decisions.scenes.flatMap((s) => s.ranked.map((r) => r.productId)));
    for (const id of ids) {
      const p = PRODUCTS.get(id);
      if (p) new Image().src = assetUrl(p.imagePath);
    }
  }, [decisions]);

  return (
    <main className="mx-auto max-w-5xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mb-3 font-serif text-title">{clip.title}</h1>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
        <video
          ref={video}
          src={assetUrl(clip.videoUrl)}
          controls
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-contain ${view ? "brightness-70 saturate-35" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            toggle(e.currentTarget);
          }}
          onPlay={() => setView(null)}
          onPause={showPause}
          onSeeking={() => (frameMs.current = null)}
          onSeeked={() => open.current && showPause()}
          onEnded={() => setView(null)}
        />
        {view && <PauseOverlay view={view} />}
      </div>
      <p aria-live="polite" className="sr-only">
        {view ? announce(view) : ""}
      </p>
      <p className="mt-2 text-label text-muted-foreground">AI-generated</p>
      {!decisions && <p className="mt-3 text-muted-foreground">Analysis unavailable for this scene.</p>}
    </main>
  );
}
