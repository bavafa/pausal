import { useEffect, useRef, useState } from "react";
import { assetUrl } from "./clips.ts";
import type { PauseView } from "./pause-view.ts";

const CARD = "pointer-events-auto rounded-md border border-border bg-card/95 text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm";
// The ad waits a moment, so a viewer who paused to look at the frame or read a subtitle sees it first.
const LATE_POP = "motion-safe:[animation:pop-in_220ms_cubic-bezier(0.2,0.9,0.3,1.2)_900ms_both]";
const EYEBROW = "text-eyebrow uppercase tracking-[0.08em] text-muted-foreground";
const BUTTON = "min-h-11 rounded-md bg-accent px-3 text-label font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** A chevron in a circle, inside a 44 px touch target; `left` points back toward the frame. */
function FoldIcon({ left }: { left?: boolean }) {
  return (
    <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-border bg-background/70 text-foreground">
      <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={left ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </span>
  );
}

/**
 * Overlay over the frozen frame, kept to a corner so the frame stays visible. The viewer can fold the ad to the edge
 * and bring it back. Only the card and its tab take pointer events, so a click on the frame still resumes.
 */
export function PauseOverlay({ view, onViewProduct }: { view: PauseView; onViewProduct: (productId: string) => void }) {
  const [folded, setFolded] = useState(false);
  // Focus follows the control the viewer used, so it never sits on a button that just slid out of view (which would scroll the page).
  const foldButton = useRef<HTMLButtonElement>(null);
  const showButton = useRef<HTMLButtonElement>(null);
  const toggled = useRef(false);
  useEffect(() => {
    if (!toggled.current) return;
    (folded ? showButton : foldButton).current?.focus({ preventScroll: true });
  }, [folded]);
  const fold = (f: boolean) => {
    toggled.current = true;
    setFolded(f);
  };
  return (
    <div data-pause-overlay className="pointer-events-none absolute inset-0">
      {view.kind === "note" ? (
        <div className={`${CARD} absolute top-2 left-2 max-w-[calc(100%-16px)] px-3 py-1.5 text-label motion-safe:animate-pop-in`}>
          <span className="font-semibold">Paused</span> <span className="text-muted-foreground">· {view.text}</span>
        </div>
      ) : (
        <div className={`${LATE_POP} absolute top-2 right-14 left-2 sm:top-auto sm:right-2 sm:bottom-12 sm:left-auto sm:w-[370px] lg:right-4 lg:bottom-14 lg:w-[430px]`}>
          <div
            inert={folded}
            className={`${CARD} flex items-center gap-1.5 py-1.5 pr-1.5 transition-[translate,opacity] duration-300 ease-out sm:gap-2.5 sm:py-2 sm:pr-2 lg:gap-3 lg:py-2.5 lg:pr-2.5 ${folded ? "translate-x-[calc(100%+4rem)] opacity-0" : ""}`}
          >
            <button ref={foldButton} type="button" aria-label="Fold the ad away" aria-expanded={!folded} onClick={() => fold(true)} className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-accent">
              <FoldIcon />
            </button>
            <img src={assetUrl(view.product.imagePath)} alt={view.product.name} className="size-11 shrink-0 rounded-sm border border-border bg-white object-contain p-0.5 sm:size-16 lg:size-20" />
            <div className="min-w-0 flex-1">
              <p className={`${EYEBROW} truncate`}>
                Sponsored <span aria-hidden="true">·</span> Simulated ad
              </p>
              <h2 className="truncate font-serif text-label sm:text-title-sm" title={view.product.name}>
                {view.product.shortName ?? view.product.name}
              </h2>
              <p className="hidden truncate text-label text-muted-foreground lg:block" title={view.tagline}>
                {view.tagline}
              </p>
              <button type="button" onClick={() => onViewProduct(view.product.id)} className={`${BUTTON} mt-1 hidden sm:inline-block`}>
                View product
              </button>
            </div>
            {/* On a phone the card is a slim strip, so the button sits beside the name. */}
            <button type="button" onClick={() => onViewProduct(view.product.id)} className={`${BUTTON} shrink-0 sm:hidden`}>
              View
            </button>
            {/* A fixed code that decodes to plain text, not a URL, so scanning it opens nothing. */}
            <img src={assetUrl("demo-qr.svg")} alt="" title="Demo QR code, not a real link" className="hidden size-16 shrink-0 self-center rounded-sm sm:block lg:size-20" />
          </div>
          {folded && (
            <button
              type="button"
              ref={showButton}
              aria-label="Show the ad again"
              aria-expanded={false}
              onClick={() => fold(false)}
              className={`${CARD} absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1.5 rounded-full py-1 pr-1 pl-2 motion-safe:animate-pop-in sm:-right-1 lg:-right-3`}
            >
              <FoldIcon left />
              <img src={assetUrl(view.product.imagePath)} alt="" className="size-9 rounded-full bg-white object-contain p-0.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
