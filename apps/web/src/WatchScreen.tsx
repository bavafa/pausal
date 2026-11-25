import { useCallback, useEffect, useRef, useState } from "react";
import type { Decisions, Manifest } from "@pausal/bundle-schema";
import { rankAt, type Held, type RankView } from "@pausal/policy";
import { assetUrl, PRODUCTS } from "./clips.ts";
import { PauseOverlay } from "./PauseOverlay.tsx";
import { ScenePanel } from "./ScenePanel.tsx";
import { ProductList } from "./ProductList.tsx";
import { productList } from "./product-list.ts";
import { announce, pauseView, type PauseView } from "./pause-view.ts";
import type { PauseEntry } from "./session.ts";
import { EarningsTally } from "./EarningsTally.tsx";

/** Preloaded product images stay referenced, so a later <img> is drawn from memory with no request (AD-1). */
const PRELOADED = new Map<string, HTMLImageElement>();

/** Element full screen is missing on iPhone Safari; there the video's own full screen stays (without the ad card). */
const CAN_FULLSCREEN = typeof document !== "undefined" && document.fullscreenEnabled;

const toggle = (v: HTMLVideoElement) => void (v.paused ? v.play().catch(() => {}) : v.pause());

/** Elements that handle Space themselves; the page shortcut stays out of their way. */
const OWNS_SPACE = "a, button, input, textarea, select, video, [contenteditable]";

/** With requestVideoFrameCallback the frame time drives the panel; timeupdate is only the fallback, so the two never disagree at a boundary. */
const HAS_RVFC = typeof HTMLVideoElement !== "undefined" && "requestVideoFrameCallback" in HTMLVideoElement.prototype;

type Props = {
  clip: Manifest;
  decisions: Decisions | null;
  /** The session pause log, all clips in this page load. */
  pauses: readonly PauseEntry[];
  /** A real pause opened the pause view; a seek while paused is not a new pause. */
  onPause: (entry: PauseEntry) => void;
  onViewProduct: (productId: string) => void;
  /** Replaces the credit line, for an uploaded video: analysis progress or an error. */
  note?: string;
  /** For an uploaded video: the player waits behind a progress view until every part is analyzed. */
  analysis?: { doneMs: number; totalMs: number; error: string | null };
};

export function WatchScreen({ clip, decisions, pauses, onPause, onViewProduct, note, analysis }: Props) {
  const [watchAnyway, setWatchAnyway] = useState(false);
  const waiting = !!analysis && analysis.doneMs < analysis.totalMs && !watchAnyway;
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === box.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  /** Media time (ms) of the last presented frame from requestVideoFrameCallback; null when unknown. */
  const frameMs = useRef<number | null>(null);
  const [view, setView] = useState<PauseView | null>(null);
  const open = useRef(false);
  open.current = view !== null;
  const waitingRef = useRef(waiting);
  waitingRef.current = waiting;
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
  // The hold steadies the list while playing; once paused, the list leads with the product the pause card shows.
  const list = productList(rank.scene, view ? (rank.scene?.ranked ?? []) : rank.ranked, PRODUCTS);

  // Only a pause opens the view (not a fresh load). Never an overlay while playing or after the clip ended.
  const showPause = useCallback((): PauseEntry | null => {
    const v = video.current;
    if (!v || !v.paused || v.ended) return (setView(null), null);
    const tMs = Math.floor(frameMs.current ?? v.currentTime * 1000);
    const next = pauseView(decisions, PRODUCTS, tMs);
    setView(next);
    return { clipId: clip.clipId, tMs, view: next, click: null };
  }, [decisions, clip.clipId]);

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
      if (!v || e.repeat || !v.checkVisibility() || waitingRef.current) return; // hidden behind the product page, or still analyzing
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
    // The ad card's QR code is the same image on every ad; load it with the product images so a pause makes no request.
    const qr = assetUrl("demo-qr.svg");
    if (!PRELOADED.has(qr)) PRELOADED.set(qr, Object.assign(new Image(), { src: qr }));
    const ids = new Set(decisions.scenes.flatMap((s) => s.ranked.map((r) => r.productId)));
    for (const id of ids) {
      const p = PRODUCTS.get(id);
      if (p && !PRELOADED.has(p.imagePath)) {
        const img = new Image();
        img.src = assetUrl(p.imagePath);
        PRELOADED.set(p.imagePath, img);
      }
    }
  }, [decisions]);

  return (
    <main className="mx-auto max-w-5xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mb-3 font-serif text-title">{clip.title}</h1>
      <div ref={box} className="relative aspect-video w-full overflow-hidden rounded-md bg-black [&:fullscreen]:aspect-auto [&:fullscreen]:rounded-none">
        <video
          ref={video}
          src={assetUrl(clip.videoUrl)}
          controls={!waiting}
          // Full screen goes through our button on the whole player, so the ad card comes along; iPhone Safari keeps the native one.
          {...(CAN_FULLSCREEN ? { controlsList: "nofullscreen", disablePictureInPicture: true } : {})}
          onDoubleClick={(e) => e.preventDefault()}
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
          onClick={(e) => {
            e.preventDefault();
            if (!waiting) toggle(e.currentTarget);
          }}
          onPlay={() => setView(null)}
          onPause={() => {
            const entry = showPause();
            if (entry) onPause(entry);
          }}
          onSeeking={() => (frameMs.current = null)}
          onSeeked={(e) => {
            track(e.currentTarget.currentTime * 1000); // after a seek currentTime is the target frame; rVFC may come late while paused
            if (open.current) showPause();
          }}
          onTimeUpdate={(e) => !HAS_RVFC && track(e.currentTarget.currentTime * 1000)}
          onEnded={() => setView(null)}
        />
        {view && <PauseOverlay view={view} onViewProduct={onViewProduct} />}
        {CAN_FULLSCREEN && !waiting && (
          <button
            type="button"
            aria-label={fullscreen ? "Exit full screen" : "Full screen"}
            onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())?.catch(() => {})}
            className="absolute top-2 right-2 grid size-11 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-opacity hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-white"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
              {fullscreen ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
            </svg>
          </button>
        )}
        {waiting && analysis && <AnalysisWait {...analysis} onWatch={() => setWatchAnyway(true)} />}
        {!view && !waiting && !pauses.some((p) => p.clipId === clip.clipId) && (
          // A first-visit nudge; it goes away for good after the first pause on this clip.
          <span aria-hidden="true" className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-label text-white backdrop-blur-sm motion-safe:animate-nudge">
            <svg viewBox="0 0 24 24" className="size-3.5 fill-current">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
            Pause anywhere and see what shows up
          </span>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {view ? announce(view) : ""}
      </p>
      <p className="mt-2 text-label text-muted-foreground" {...(note ? { role: "status" } : {})}>
        {note ?? (clip.aiGenerated ? "AI-generated" : <a href="#/attribution" className="underline-offset-4 hover:underline">Film excerpt, credits</a>)}
      </p>
      <EarningsTally log={pauses} clipId={clip.clipId} />
      <ScenePanel scene={rank.scene} />
      {list && <ProductList view={list} />}
    </main>
  );
}

/** Covers the player while an upload is analyzed. Progress is time analyzed, since parts finish out of order. */
function AnalysisWait({ doneMs, totalMs, error, onWatch }: { doneMs: number; totalMs: number; error: string | null; onWatch: () => void }) {
  const pct = Math.round((100 * doneMs) / Math.max(totalMs, 1));
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/75 p-4 text-center text-white backdrop-blur-sm">
      <div className="w-full max-w-sm">
        {error ? (
          <>
            <p className="font-serif text-title-sm">Part of the video could not be analyzed</p>
            <p className="mt-1 text-label text-white/75">{error} Pausing there shows no ad.</p>
            <button type="button" onClick={onWatch} className="mt-4 min-h-11 rounded-md bg-accent px-5 font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Watch anyway
            </button>
          </>
        ) : (
          <>
            <p className="font-serif text-title-sm">Analyzing your video</p>
            <p className="mt-1 text-label text-white/75">Checking each scene for safety and fit. Press play once this is done.</p>
            <div role="progressbar" aria-label="Analysis progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${Math.max(pct, 4)}%` }} />
            </div>
            <p className="mt-2 text-label text-white/75">{pct}%</p>
          </>
        )}
      </div>
    </div>
  );
}
