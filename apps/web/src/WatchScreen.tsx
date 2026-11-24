import { useEffect, useRef } from "react";
import type { Decisions, Manifest } from "@pausall/bundle-schema";
import { videoSrc } from "./clips.ts";

const toggle = (v: HTMLVideoElement) => void (v.paused ? v.play().catch(() => {}) : v.pause());

/** Elements that handle Space themselves; the page shortcut stays out of their way. */
const OWNS_SPACE = "a, button, input, textarea, select, video, [contenteditable]";

export function WatchScreen({ clip, decisions }: { clip: Manifest; decisions: Decisions | null }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " || e.repeat || !video.current) return;
      if (e.target instanceof Element && e.target.closest(OWNS_SPACE)) return;
      e.preventDefault();
      toggle(video.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mb-3 font-serif text-title">{clip.title}</h1>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black">
        <video
          ref={video}
          src={videoSrc(clip.videoUrl)}
          controls
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-contain"
          onClick={(e) => {
            e.preventDefault();
            toggle(e.currentTarget);
          }}
        />
      </div>
      <p className="mt-2 text-label text-muted-foreground">AI-generated</p>
      {!decisions && <p className="mt-3 text-muted-foreground">Analysis unavailable for this scene.</p>}
    </main>
  );
}
