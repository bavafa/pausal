import { assetUrl } from "./clips.ts";
import type { PauseView } from "./pause-view.ts";

const CARD = "pointer-events-auto rounded-md border border-border bg-card text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)] motion-safe:animate-fade-in";
const EYEBROW = "text-eyebrow uppercase tracking-[0.08em] text-muted-foreground";

/** Overlay over the frozen frame. Only the card takes pointer events, so a click on the frame still resumes. */
export function PauseOverlay({ view, onViewProduct }: { view: PauseView; onViewProduct: (productId: string) => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 bg-frozen-scrim">
      {view.kind === "note" ? (
        <div className={`${CARD} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-max max-w-[calc(100%-16px)] px-5 py-3 text-center`}>
          <p>Paused</p>
          <p className="mt-1 text-label text-muted-foreground">{view.text}</p>
        </div>
      ) : (
        <div
          className={`${CARD} absolute inset-x-2 top-2 bottom-[72px] grid grid-cols-[40%_1fr] items-center gap-3 p-2.5 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:w-[78%] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:grid-cols-[38%_1fr] lg:gap-3.5 lg:p-3.5`}
        >
          <img
            src={assetUrl(view.product.imagePath)}
            alt={view.product.name}
            className="h-full w-full rounded-md border border-border bg-muted object-cover lg:aspect-square lg:h-auto"
          />
          <div className="min-w-0">
            <p className={EYEBROW}>
              Sponsored <span aria-hidden="true">·</span> Simulated ad
            </p>
            <h2 className="mt-1 mb-1.5 font-serif text-title-sm lg:text-title">{view.product.name}</h2>
            <p className="mb-2.5 hidden lg:block">{view.tagline}</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => onViewProduct(view.product.id)} className="min-h-11 rounded-md bg-accent px-4 font-semibold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
                View product
              </button>
              <span className="hidden items-center gap-2 lg:flex">
                <span aria-hidden="true" className="size-[34px] bg-[repeating-conic-gradient(var(--foreground)_0_25%,transparent_0_50%)] bg-size-[8px_8px] opacity-35" />
                <span className="text-label text-muted-foreground">Demo QR, not a real link</span>
              </span>
            </div>
            <p className="mt-2 hidden text-label text-muted-foreground lg:block">{view.because}</p>
          </div>
        </div>
      )}
    </div>
  );
}
