import { useMemo } from "react";
import type { Manifest } from "@pausal/bundle-schema";
import { assetUrl, loadDecisions } from "./clips.ts";
import { HeroDemo } from "./HeroDemo.tsx";
import { clipHref } from "./route.ts";
import { pauseShares, percent } from "./tradeoff.ts";

const EYEBROW = "text-eyebrow uppercase tracking-[0.08em] text-accent font-semibold";
const H2 = "mt-2 font-serif text-[26px] leading-tight md:text-[30px]";

/** What happens between the click and the overlay. All of it is worked out before the page loads (AD-1). */
const STEPS = [
  ["Find the scene", "It works out which scene you stopped on. Scene cuts are only known to within a second, so if the second before your pause was unsafe, you get no ad."],
  ["Check it is safe", "Two AI models look for violence, grief, sex, medical scenes, children and arguments. If both flag the scene, no ad."],
  ["Score the products", "Each of 20,000 catalog products gets a fit score out of 100 for this scene. Under 60, it stays hidden. A higher bar means fewer ads that fit better."],
  ["One ad, or none", "You get one product, or a line saying why there isn't one."],
] as const;

const minutes = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const toClips = () => document.getElementById("clips")?.scrollIntoView({ behavior: "smooth", block: "start" });

export function ClipPicker({ clips }: { clips: Manifest[] }) {
  // Computed from the shipped decisions, so the numbers always match what the clips do.
  const shares = useMemo(() => pauseShares(clips.flatMap((c) => loadDecisions(c) ?? [])), [clips]);
  return (
    <main className="mx-auto max-w-5xl px-gutter-phone md:px-gutter-laptop">
      <section className="grid items-center gap-8 py-10 md:grid-cols-[1fr_1.15fr] md:py-16">
        <div>
          <p className={EYEBROW}>An experiment in video ads</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.1] md:text-[46px]">The ad waits for you to pause.</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Pause on a hiker at the summit and a backpack appears. Pause on a runner and it might be trail shoes. Pause in the middle of a gunfight and nothing does. Every scene is checked before it can carry an ad.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toClips}
              className="min-h-11 rounded-md bg-accent px-5 font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Try a clip
            </button>
            <a
              href="#/upload"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-5 font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Try your own video
            </a>
            <span className="basis-full text-label text-muted-foreground">Every ad and price here is made up.</span>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="border-t border-border py-12">
        <p className={EYEBROW}>Why pause</p>
        <h2 className={H2}>The one moment an ad doesn't interrupt anything</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            Mid-roll ads cut in when the video decides. A pause is your decision, so the ad stays out of the way: it waits a beat, takes one corner of the
            frame, and folds to the edge with one tap when you want the whole picture back.
          </p>
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            It only works if the product suits the moment. Hiking boots belong on a mountain trail, not in a boardroom. When nothing fits, or the scene is one no
            brand should sit next to, you get no ad at all.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">Paused on: someone cooking in a sunny kitchen</p>
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              Ad: Everyday Skillet
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">Paused on: a hiker resting on a mountain trail</p>
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              Ad: a daypack
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">Paused on: a gunfight</p>
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground" />
              No ad here: sensitive scene.
            </p>
          </div>
        </div>
        {shares.pauses > 0 && (
          <div className="mt-6 rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">The trade-off, with every sample clip paused every tenth of a second</p>
            <dl className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-label text-muted-foreground">A generic pause ad</dt>
                <dd className="font-serif text-[28px] leading-tight">100%</dd>
                <dd className="text-label text-muted-foreground">of pauses show an ad, whatever is on screen</dd>
              </div>
              <div>
                <dt className="text-label text-muted-foreground">Pausal</dt>
                <dd className="font-serif text-[28px] leading-tight text-accent">{percent(shares.ad)}</dd>
                <dd className="text-label text-muted-foreground">of pauses show an ad that fits the scene</dd>
              </div>
              <div>
                <dt className="text-label text-muted-foreground">Held back</dt>
                <dd className="font-serif text-[28px] leading-tight">{percent(100 - shares.ad)}</dd>
                <dd className="text-label text-muted-foreground">
                  {percent(shares.nothingFits)} nothing fit well, {percent(shares.sensitiveScene)} sensitive scene, {percent(shares.noActiveCampaign)} no active campaign
                  {shares.analysisUnavailable > 0 && `, ${percent(shares.analysisUnavailable)} not analyzed`}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </section>

      <section className="border-t border-border py-12">
        <p className={EYEBROW}>Under the hood</p>
        <h2 className={H2}>What happens when you pause</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4 md:gap-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="relative">
              {i < STEPS.length - 1 && <span aria-hidden="true" className="absolute top-4 left-10 hidden h-px w-[calc(100%-2rem)] bg-border md:block" />}
              <span aria-hidden="true" className="relative grid size-8 place-items-center rounded-full border border-accent bg-background text-label font-semibold text-accent">
                {i + 1}
              </span>
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-label leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
        <p className="mt-8 rounded-md bg-muted px-4 py-3 text-label text-muted-foreground">
          Scenes are analyzed before you reach them, so the answer is ready the instant you pause. To keep it honest, a test script pauses every
          clip every tenth of a second and flags any ad that lands on a scene a person marked unsafe.
        </p>
      </section>

      <section className="border-t border-border py-12">
        <p className={EYEBROW}>The catalog</p>
        <h2 className={H2}>20,000 real products to choose from</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            The ads draw on 20,000 products from Amazon Berkeley Objects, an open dataset of real listings: cookware, furniture, shoes, luggage, garden
            tools and more. For each scene the model searches all of them for the one that fits best.
          </p>
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            More products means more scenes find a good match. A bigger catalog would turn more of the &ldquo;nothing fit well&rdquo; pauses into ads that
            belong there, without lowering the bar. The full dataset has about 147,000 listings; this is a slice of it.
          </p>
        </div>
      </section>

      <section id="clips" className="scroll-mt-16 border-t border-border py-12">
        <p className={EYEBROW}>Try it</p>
        <h2 className={H2}>Pick a clip, press play, pause anywhere.</h2>
        <p className="mt-2 text-muted-foreground">Click the video or press Space. Pause on something calm, then on something tense, and compare.</p>
        {clips.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">Sample clips are on their way.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {clips.map((c) => (
              <li key={c.clipId}>
                <a
                  href={clipHref(c.clipId)}
                  className="group flex min-h-11 flex-col overflow-hidden rounded-md border border-border bg-card outline-offset-2 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-[0_12px_30px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <span className="relative block">
                    {/* The first frame as a still preview; nothing plays here. */}
                    <video src={`${assetUrl(c.videoUrl)}#t=1`} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" className="aspect-video w-full bg-black object-cover" />
                    <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/25">
                      <span className="grid size-12 scale-90 place-items-center rounded-full bg-accent text-accent-foreground opacity-0 transition group-hover:scale-100 group-hover:opacity-100">
                        <svg viewBox="0 0 24 24" className="ml-0.5 size-5 fill-current">
                          <path d="M7 5v14l12-7z" />
                        </svg>
                      </span>
                    </span>
                  </span>
                  <span className="flex items-baseline justify-between gap-3 p-4">
                    <span className="font-serif text-title-sm">{c.title}</span>
                    <span className="shrink-0 text-label text-muted-foreground">{c.aiGenerated ? "AI-generated · " : ""}{minutes(c.durationMs)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-6 text-label text-muted-foreground">
        <span>Ads, bids and earnings here are simulated.</span>
        <a href="#/attribution" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
          Attribution
        </a>
      </footer>
    </main>
  );
}
