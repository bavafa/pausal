import type { Manifest } from "@pausall/bundle-schema";
import { assetUrl } from "./clips.ts";
import { HeroDemo } from "./HeroDemo.tsx";
import { clipHref } from "./route.ts";

const EYEBROW = "text-eyebrow uppercase tracking-[0.08em] text-accent font-semibold";
const H2 = "mt-2 font-serif text-[26px] leading-tight md:text-[30px]";

/** What happens between the click and the overlay. All of it is worked out before the page loads (AD-1). */
const STEPS = [
  ["Find the moment", "The frame you stopped on, plus anything from the second before it, so a cut cannot sneak an ad in."],
  ["Check it is safe", "Two separate AI judges look for violence, grief, sexual content, medical scenes, children and heated arguments. Both have to agree it is fine."],
  ["Find something that fits", "Products from a 20,000 item catalog are scored against the scene. A weak match counts as no match."],
  ["One ad, or the reason why not", "You see a single product that fits, or a short note saying why nothing is shown."],
] as const;

const minutes = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const toClips = () => document.getElementById("clips")?.scrollIntoView({ behavior: "smooth", block: "start" });

export function ClipPicker({ clips }: { clips: Manifest[] }) {
  return (
    <main className="mx-auto max-w-5xl px-gutter-phone md:px-gutter-laptop">
      <section className="grid items-center gap-8 py-10 md:grid-cols-[1fr_1.15fr] md:py-16">
        <div>
          <p className={EYEBROW}>An experiment in calmer video ads</p>
          <h1 className="mt-3 font-serif text-[36px] leading-[1.1] md:text-[46px]">Ads that wait until you pause.</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
            Hit pause and Pausall looks at the scene you stopped on. An everyday moment gets one product that fits. Anything sad, violent or tense gets nothing at
            all.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={toClips}
              className="min-h-11 rounded-md bg-accent px-5 font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Try a clip
            </button>
            <span className="text-label text-muted-foreground">Nothing is real money, and nothing leaves your browser.</span>
          </div>
        </div>
        <HeroDemo />
      </section>

      <section className="border-t border-border py-12">
        <p className={EYEBROW}>The idea</p>
        <h2 className={H2}>A pause is a moment you choose.</h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            Most video ads cut in when the video decides. A pause is different. You stopped on purpose, the frame is still, and you have a second to look around.
            That makes it a fair moment for one quiet suggestion.
          </p>
          <p className="text-[16px] leading-relaxed text-muted-foreground">
            It also makes a bad suggestion feel worse. A frying pan next to a cooking scene is fine. The same pan next to a funeral is not. So the scene always
            comes first, and when in doubt, Pausall shows nothing.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">You pause on someone cooking in a sunny kitchen</p>
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              Everyday Skillet, because it fits a kitchen scene
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-label text-muted-foreground">You pause on two people in a shouting match</p>
            <p className="mt-2 flex items-center gap-2 font-semibold">
              <span aria-hidden="true" className="size-2 rounded-full bg-muted-foreground" />
              No ad here: sensitive scene.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-12">
        <p className={EYEBROW}>Under the hood</p>
        <h2 className={H2}>What happens in the half second after you pause</h2>
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
          Every clip is analyzed ahead of time, so pausing sends nothing anywhere and the answer is already waiting. A test pauses each clip every tenth of a
          second and fails the build if a single ad lands on a scene a person marked unsafe.
        </p>
      </section>

      <section id="clips" className="scroll-mt-16 border-t border-border py-12">
        <p className={EYEBROW}>Try it</p>
        <h2 className={H2}>Pick a clip, press play, pause anywhere.</h2>
        <p className="mt-2 text-muted-foreground">Click the video or press Space. Try a calm moment, then a tense one.</p>
        {clips.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-border p-6 text-center text-muted-foreground">The sample clips are on their way.</p>
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
                    <span className="shrink-0 text-label text-muted-foreground">AI-generated · {minutes(c.durationMs)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-6 text-label text-muted-foreground">
        <span>Everything here is simulated: no real ads, no real money, nothing you do is sent anywhere.</span>
        <a href="#/attribution" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
          Attribution
        </a>
      </footer>
    </main>
  );
}
