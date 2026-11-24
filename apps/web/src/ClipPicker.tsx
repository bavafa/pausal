import type { Manifest } from "@pausall/bundle-schema";
import { clipHref } from "./route.ts";

export function ClipPicker({ clips }: { clips: Manifest[] }) {
  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-8 md:px-gutter-laptop">
      <h1 className="font-serif text-title">Pausall</h1>
      <p className="mt-2 text-muted-foreground">Pause a clip. An ad appears only when the scene fits. Every ad is simulated.</p>
      {clips.length === 0 ? (
        <p className="mt-6 text-muted-foreground">No clips yet.</p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {clips.map((c) => (
            <li key={c.clipId}>
              <a
                href={clipHref(c.clipId)}
                className="flex min-h-11 flex-col gap-1 rounded-md border border-border bg-card p-4 outline-offset-2 hover:border-accent focus-visible:outline-2 focus-visible:outline-accent"
              >
                <span className="font-serif text-title-sm">{c.title}</span>
                <span className="text-label text-muted-foreground">AI-generated</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-8 text-label text-muted-foreground">
        <a href="#/attribution" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
          Attribution
        </a>
      </p>
    </main>
  );
}
