import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./clips.ts";

/** Where the demo pauses: she smiles over the pan with the egg in it. */
const PAUSE_AT_S = 8.6;

/** What happens after the pause, in order, with how long each step lasts (ms). Then the video plays on and loops. */
const STEPS = [
  ["paused", 900],
  ["card", 1700],
  ["aim", 900],
  ["folded", 1900],
  ["back", 1700],
] as const;
type Phase = "playing" | (typeof STEPS)[number][0];

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The pointer that folds the ad away and brings it back. */
function Cursor() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
      <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#111" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function Chevron({ left }: { left?: boolean }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background/70">
      <svg viewBox="0 0 24 24" className="size-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={left ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </span>
  );
}

/**
 * The landing demo on a short AI-generated clip: it plays, pauses on the cooking moment, a small ad arrives in the
 * corner, a pointer folds it to the edge and brings it back, and the video plays on. With reduced motion it shows the
 * paused frame with the ad and plays nothing.
 */
export function HeroDemo() {
  const video = useRef<HTMLVideoElement>(null);
  const [still] = useState(reducedMotion);
  const [phase, setPhase] = useState<Phase>(still ? "card" : "playing");

  useEffect(() => {
    const v = video.current;
    if (still || !v) return;
    let timer = 0;
    let paused = false;
    const run = (i: number) => {
      const step = STEPS[i];
      if (!step) {
        setPhase("playing");
        void v.play().catch(() => {});
        return;
      }
      setPhase(step[0]);
      timer = window.setTimeout(() => run(i + 1), step[1]);
    };
    const onTime = () => {
      if (!paused && v.currentTime >= PAUSE_AT_S) {
        paused = true;
        v.pause();
        run(0);
      }
    };
    // A new loop may pause again.
    const onSeeked = () => v.currentTime < PAUSE_AT_S && (paused = false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("seeked", onSeeked);
    void v.play().catch(() => {});
    return () => {
      window.clearTimeout(timer);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("seeked", onSeeked);
    };
  }, [still]);

  const cardShown = phase === "card" || phase === "aim" || phase === "back";
  const folded = phase === "folded";
  const cursor = phase === "aim" || phase === "folded";

  return (
    <figure className="relative">
      <div aria-hidden="true" className="relative aspect-video w-full overflow-hidden rounded-md bg-black shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-border">
        {still ? (
          <img src={assetUrl("media/hero-eggs-paused.jpg")} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <video
            ref={video}
            src={assetUrl("media/hero-eggs.mp4")}
            poster={assetUrl("media/hero-eggs-paused.jpg")}
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Pause badge */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className={`grid size-12 place-items-center rounded-full bg-black/55 transition duration-300 ${phase === "paused" ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
            <svg viewBox="0 0 24 24" className="size-5 fill-white">
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          </span>
        </div>

        {/* The ad: a corner card that folds to the edge, the same shape as the real one */}
        <div className="pointer-events-none absolute right-[3%] bottom-[7%] w-[64%] sm:w-[56%]">
          <div
            className={`flex items-center gap-2 rounded-md border border-border bg-card/95 p-1.5 pl-1 text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition duration-300 ease-out ${
              cardShown ? "translate-x-0 translate-y-0 opacity-100" : folded ? "translate-x-[115%] opacity-0" : "translate-y-3 opacity-0"
            }`}
          >
            <Chevron />
            <img src={assetUrl("products/fixture-pan.svg")} alt="" className="size-11 shrink-0 rounded-sm border border-border bg-white object-contain p-0.5 sm:size-14" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[9px] uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">Sponsored · Simulated ad</span>
              <span className="block truncate font-serif text-[15px] leading-tight sm:text-title-sm">Everyday Skillet</span>
              <span className="mt-1 inline-block rounded-sm bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">View product</span>
            </span>
            <img src={assetUrl("demo-qr.svg")} alt="" className="hidden size-12 shrink-0 rounded-sm sm:block" />
          </div>
          <span
            className={`absolute top-1/2 right-[-2%] flex -translate-y-1/2 items-center gap-1 rounded-full border border-border bg-card/95 py-0.5 pr-0.5 pl-1 text-foreground shadow-lg transition duration-300 ${folded ? "opacity-100" : "translate-x-3 opacity-0"}`}
          >
            <Chevron left />
            <img src={assetUrl("products/fixture-pan.svg")} alt="" className="size-7 rounded-full bg-white object-contain p-0.5" />
          </span>
          <span
            className={`absolute top-1/2 transition-[left,opacity] duration-700 ease-in-out ${cursor ? "opacity-100" : "opacity-0"} ${folded ? "left-[88%]" : "left-[2%]"}`}
          >
            <Cursor />
          </span>
        </div>
      </div>
      <figcaption className="mt-2 text-label text-muted-foreground">AI-generated clip. Pause on a kitchen, get a frying pan. One tap folds it away.</figcaption>
    </figure>
  );
}
