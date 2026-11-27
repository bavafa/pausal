import { useState } from "react";
import type { Decisions, Manifest } from "@pausal/bundle-schema";
import { PRODUCTS } from "./clips.ts";
import { clipHref } from "./route.ts";
import { audioPcm, checkFile, CHUNK_MS, chunkBody, fileId, FrameReader, placeChunk, RELAY_URL } from "./upload.ts";

/** `step` says what the browser is doing right now, so a slow phone never looks stuck at 0%. */
export type UploadState = { clip: Manifest; chunks: Decisions[]; doneMs: number; error: string | null; step?: string };

const LINK = "text-accent underline underline-offset-4";

/** Reads frames and sound chunk by chunk and sends up to 5 chunks to the relay at once; each answer is added as it arrives. */
async function analyze(file: File, clip: Manifest, video: HTMLVideoElement, unlocked: Promise<boolean>, update: (f: (s: UploadState) => UploadState) => void) {
  const fail = (error: string) => update((s) => ({ ...s, error: s.error ?? error }));
  const step = (text: string) => update((s) => ({ ...s, step: text }));
  step("Opening your video…");
  if (!(await unlocked)) {
    // The phone refused to play without a fresh tap; one tap anywhere starts it.
    step("Tap anywhere to start reading your video");
    await new Promise<void>((resolve) => {
      const onTap = () => void video.play().then(() => (video.pause(), document.removeEventListener("click", onTap), resolve()), () => {});
      document.addEventListener("click", onTap);
    });
  }
  const reader = new FrameReader(video);
  step("Reading the sound…");
  const pcm = await audioPcm(file);
  const seconds = Math.ceil(clip.durationMs / 1000);
  const inFlight = new Set<Promise<void>>();
  for (let start = 0; start < clip.durationMs; start += CHUNK_MS) {
    const end = Math.min(start + CHUNK_MS, clip.durationMs);
    const frames = [];
    for (let t = start; t < end; t += 1000) {
      step(`Reading frame ${t / 1000 + 1} of ${seconds}…`);
      frames.push(await reader.frame(t));
    }
    step("Waiting for the analysis…");
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
    if (inFlight.size >= 5) await Promise.race(inFlight);
  }
  await Promise.all(inFlight);
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
    // The probe is also the video the frames are read from. iPhone loads no frame data for a video until it has
    // played once, so it starts playing here, still inside the tap that chose the file, and pauses straight away.
    const probe = Object.assign(document.createElement("video"), { src: url, muted: true, playsInline: true, preload: "auto" });
    const unlocked = probe.play().then(() => (probe.pause(), true), () => false);
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
    onStart(clip, (update) => analyze(file, clip, probe, unlocked, update));
    location.hash = clipHref(clipId);
  };

  return (
    <main className="mx-auto max-w-3xl px-gutter-phone py-4 md:px-gutter-laptop">
      <a href="#/" className="inline-flex min-h-11 items-center text-accent underline-offset-4 hover:underline">
        Back to clips
      </a>
      <h1 className="mt-2 font-serif text-title">Try it on your own video</h1>
      <div className="mt-4 space-y-4 rounded-md border border-border bg-card p-4 md:p-6">
        <p>Pick a clip from your phone. Pausal goes through it scene by scene first and shows you the progress. When it's done, press play and pause anywhere.</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Up to 3 minutes and 100 MB. MP4, MOV or WebM.</li>
          <li>The file itself is not uploaded. Only one frame per second and the sound go to Alibaba Model Studio (Qwen) and TypeSafe (Jev), and nothing is kept.</li>
          <li>Three videos a day. Ads and prices are simulated. Product data: <a className={LINK} href="#/attribution">Amazon Berkeley Objects</a>.</li>
        </ul>
        <label className={`inline-flex min-h-11 items-center rounded-md px-5 font-semibold ${!busy ? "cursor-pointer bg-accent text-accent-foreground" : "cursor-not-allowed bg-muted text-muted-foreground"}`}>
          {busy ? "Reading your video…" : "Choose a video"}
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
