import { useState } from "react";
import type { Decisions, Manifest } from "@pausal/bundle-schema";
import { PRODUCTS } from "./clips.ts";
import { clipHref } from "./route.ts";
import { audioPcm, checkFile, CHUNK_MS, chunkBody, fileId, FrameReader, placeChunk, RELAY_URL } from "./upload.ts";

export type UploadState = { clip: Manifest; chunks: Decisions[]; doneMs: number; error: string | null };

const LINK = "text-accent underline underline-offset-4";

/** Reads frames and sound chunk by chunk and sends up to 3 chunks to the relay at once; each answer is added as it arrives. */
async function analyze(file: File, clip: Manifest, update: (f: (s: UploadState) => UploadState) => void) {
  const fail = (error: string) => update((s) => ({ ...s, error: s.error ?? error }));
  const url = URL.createObjectURL(file);
  const video = Object.assign(document.createElement("video"), { src: url, muted: true, preload: "auto" });
  await new Promise((r) => (video.onloadeddata = r));
  const reader = new FrameReader(video);
  const pcm = await audioPcm(file);
  const inFlight = new Set<Promise<void>>();
  for (let start = 0; start < clip.durationMs; start += CHUNK_MS) {
    const end = Math.min(start + CHUNK_MS, clip.durationMs);
    const frames = [];
    for (let t = start; t < end; t += 1000) frames.push(await reader.frame(t));
    const body = chunkBody(clip.clipId, start, end, frames, pcm);
    const send = () => fetch(RELAY_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    // One retry on a server error (a cold start can fail once); 503 means the daily cap, which a retry cannot help.
    const job = send()
      .then((r) => (r.status >= 500 && r.status !== 503 ? send() : r))
      .then(async (r) => {
        const answer: unknown = await r.json().catch(() => null);
        if (!r.ok) throw new Error((answer as { error?: string } | null)?.error ?? "The analysis service is not available right now.");
        const placed = placeChunk(answer, clip.clipId, start, end);
        // Relay products join the page's product map so the list, the ad card and the product page can show them.
        for (const p of placed.products) PRODUCTS.set(p.id, p);
        update((s) => ({ ...s, chunks: [...s.chunks, placed.decisions], doneMs: s.doneMs + (end - start) }));
      })
      .catch((e: unknown) => fail(e instanceof Error && e.message !== "Failed to fetch" ? e.message : "The analysis service could not be reached."));
    inFlight.add(job);
    void job.finally(() => inFlight.delete(job));
    if (inFlight.size >= 3) await Promise.race(inFlight);
  }
  await Promise.all(inFlight);
  URL.revokeObjectURL(url);
}

export function UploadPage({ onStart }: { onStart: (clip: Manifest, run: (update: (f: (s: UploadState) => UploadState) => void) => Promise<void>) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const early = checkFile(file);
    if (early) return setError(early);
    setBusy(true);
    const url = URL.createObjectURL(file);
    const probe = Object.assign(document.createElement("video"), { src: url, preload: "metadata" });
    const durationMs = await new Promise<number>((r) => {
      probe.onloadedmetadata = () => r(Math.round(probe.duration * 1000));
      probe.onerror = () => r(0);
    });
    const late = checkFile(file, durationMs);
    if (late) {
      URL.revokeObjectURL(url);
      setBusy(false);
      return setError(late);
    }
    const clipId = await fileId(file);
    const clip: Manifest = { clipId, title: file.name.replace(/\.[^.]+$/, ""), videoUrl: url, durationMs: durationMs as Manifest["durationMs"], aiGenerated: false, hasDialogue: true, attributionKey: "upload" };
    onStart(clip, (update) => analyze(file, clip, update));
    location.hash = clipHref(clipId);
  };

  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">Use your own video</h1>
      <div className="mt-4 space-y-4 rounded-md border border-border bg-card p-4 md:p-6">
        <p>Try Pausal on any short video. It plays right away while Pausal analyzes it in real time. Longer videos take a few minutes to finish, so a pause on a part that is not ready yet shows no ad.</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Any clip up to 3 minutes and 100 MB works, for example one from your phone (MP4, MOV or WebM).</li>
          <li>The video file is not uploaded. Pausal sends one frame per second and the sound to Alibaba Model Studio (Qwen) and TypeSafe (Jev) for analysis, and keeps nothing from your video.</li>
          <li>3 videos per day. All ads and prices are simulated. Product data: <a className={LINK} href="#/attribution">Amazon Berkeley Objects</a>.</li>
        </ul>
        <label className={`inline-flex min-h-11 items-center rounded-md px-5 font-semibold ${!busy ? "cursor-pointer bg-accent text-accent-foreground" : "cursor-not-allowed bg-muted text-muted-foreground"}`}>
          {busy ? "Reading the video…" : "Choose a video"}
          <input type="file" accept="video/mp4,video/quicktime,video/webm" disabled={busy} className="sr-only" onChange={(e) => void choose(e.target.files?.[0])} />
        </label>
        {error && (
          <p role="alert" className="text-label">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
