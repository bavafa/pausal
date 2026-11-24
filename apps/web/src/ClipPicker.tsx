import type { Manifest } from "@pausall/bundle-schema";
import { assetUrl } from "./clips.ts";
import { Logo } from "./Logo.tsx";
import { clipHref } from "./route.ts";

const STEPS = [
  ["Pick a clip", "Each one is a short video with everyday and sensitive scenes."],
  ["Play it, then pause anywhere", "Click the video or press Space."],
  ["See what the pause decides", "A product that fits the scene, or a note saying why no ad was shown."],
] as const;

const minutes = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function ClipPicker({ clips }: { clips: Manifest[] }) {
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-8 md:px-gutter-laptop">
      <Logo className="text-[34px]" />
      <h1 className="mt-5 font-serif text-title">Ads that only appear when you pause, and only when the scene fits.</h1>
      <p className="mt-2 text-muted-foreground">
        Pausall is a demo. When you pause a video, it checks the scene first. Safe, everyday scenes can show one matching product.
        Sad, violent or other sensitive scenes show no ad at all.
      </p>

      <h2 className="mt-7 text-eyebrow uppercase tracking-[0.08em] text-muted-foreground">How to try it</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {STEPS.map(([title, text], i) => (
          <li key={title} className="rounded-md border border-border bg-card p-4">
            <span aria-hidden="true" className="text-label font-semibold text-accent">{i + 1}</span>
            <p className="mt-1 font-semibold">{title}</p>
            <p className="mt-1 text-label text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 text-eyebrow uppercase tracking-[0.08em] text-muted-foreground">Choose a clip</h2>
      {clips.length === 0 ? (
        <p className="mt-3 text-muted-foreground">No clips yet.</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {clips.map((c) => (
            <li key={c.clipId}>
              <a
                href={clipHref(c.clipId)}
                className="flex min-h-11 flex-col overflow-hidden rounded-md border border-border bg-card outline-offset-2 hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                {/* The first frame as a still preview; nothing plays here. */}
                <video src={`${assetUrl(c.videoUrl)}#t=1`} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" className="aspect-video w-full bg-black object-cover" />
                <span className="flex items-baseline justify-between gap-3 p-4">
                  <span className="font-serif text-title-sm">{c.title}</span>
                  <span className="shrink-0 text-label text-muted-foreground">AI-generated · {minutes(c.durationMs)}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-label text-muted-foreground">
        Everything here is simulated: no real ads, no real money, nothing you do here is sent anywhere.{" "}
        <a href="#/attribution" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
          Attribution
        </a>
      </p>
    </main>
  );
}
