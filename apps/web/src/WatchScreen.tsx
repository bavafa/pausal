import { useCallback, useEffect, useRef, useState } from "react";
import type { Decisions, Manifest } from "@pausall/bundle-schema";
import { rankAt, type Held, type RankView } from "@pausall/policy";
import { assetUrl, PRODUCTS } from "./clips.ts";
import { PauseOverlay } from "./PauseOverlay.tsx";
import { ScenePanel } from "./ScenePanel.tsx";
import { ProductList } from "./ProductList.tsx";
import { productList } from "./product-list.ts";
import { announce, pauseView, type PauseView } from "./pause-view.ts";

const toggle = (v: HTMLVideoElement) => void (v.paused ? v.play().catch(() => {}) : v.pause());

/** Elements that handle Space themselves; the page shortcut stays out of their way. */
const OWNS_SPACE = "a, button, input, textarea, select, video, [contenteditable]";

/** With requestVideoFrameCallback the frame time drives the panel; timeupdate is only the fallback, so the two never disagree at a boundary. */
const HAS_RVFC = typeof HTMLVideoElement !== "undefined" && "requestVideoFrameCallback" in HTMLVideoElement.prototype;

export function WatchScreen({ clip, decisions }: { clip: Manifest; decisions: Decisions | null }) {
  const video = useRef<HTMLVideoElement>(null);
  /** Media time (ms) of the last presented frame from requestVideoFrameCallback; null when unknown. */
  const frameMs = useRef<number | null>(null);
  const [view, setView] = useState<PauseView | null>(null);
  const open = useRef(false);
  open.current = view !== null;
  // The held top is display only (AD-17); the pause view never reads it.
  const held = useRef<Held | null>(null);
  const rankFor = useCallback((ms: number): RankView => {
    const view: RankView = decisions ? rankAt(decisions, Math.floor(ms), held.current) : { scene: null, ranked: [], held: null };
    held.current = view.held;
    return view;
  }, [decisions]);
  const [rank, setRank] = useState(() => rankFor(0));
  // Called every frame; state changes only when the scene or the shown order changes.
  const track = useCallback((ms: number) => {
    const next = rankFor(ms);
    const key = (r: RankView) => `${r.scene?.id}|${r.ranked.map((i) => i.productId).join()}`;
    setRank((prev) => (key(prev) === key(next) ? prev : next));
  }, [rankFor]);
  const list = productList(rank.scene, rank.ranked, PRODUCTS);

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
      track(frameMs.current);
      if (v.paused && open.current) showPause(); // a seek during the pause view presents a new frame
      id = v.requestVideoFrameCallback(onFrame);
    };
    id = v.requestVideoFrameCallback(onFrame);
    return () => v.cancelVideoFrameCallback(id);
  }, [showPause, track]);

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
          onSeeked={(e) => {
            track(e.currentTarget.currentTime * 1000); // after a seek currentTime is the target frame; rVFC may come late while paused
            if (open.current) showPause();
          }}
          onTimeUpdate={(e) => !HAS_RVFC && track(e.currentTarget.currentTime * 1000)}
          onEnded={() => setView(null)}
        />
        {view && <PauseOverlay view={view} />}
      </div>
      <p aria-live="polite" className="sr-only">
        {view ? announce(view) : ""}
      </p>
      <p className="mt-2 text-label text-muted-foreground">AI-generated</p>
      <ScenePanel scene={rank.scene} />
      {list && <ProductList view={list} />}
    </main>
  );
}
