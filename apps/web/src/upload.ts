// Uploads (docs/upload-plan.md): the file stays in the browser; only 1 fps frames and 16 kHz audio go to the relay, 20 s at a time.
import { validateDecisions, validateProduct, type Decisions, type DecisionScene, type Manifest, type Product } from "@pausal/bundle-schema";

export const RELAY_URL: string = import.meta.env.VITE_RELAY_URL ?? "http://localhost:8787";
export const MAX_BYTES = 100 * 1024 * 1024;
export const MAX_MS = 180_000;
export const CHUNK_MS = 20_000;
const TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const FRAME_WIDTH = 512;
const RATE = 16_000;

/** A plain reason the file cannot be used, or null. Duration is checked once the browser has read it. */
export function checkFile(file: { type: string; size: number }, durationMs?: number): string | null {
  if (!TYPES.includes(file.type)) return "Please choose an MP4, MOV or WebM video.";
  if (file.size > MAX_BYTES) return "Please choose a video under 100 MB.";
  if (durationMs !== undefined && !(durationMs > 0)) return "Your browser could not open this video.";
  if (durationMs !== undefined && durationMs > MAX_MS) return "Please choose a video of 3 minutes or less.";
  return null;
}

/** The first 12 hex characters of the file's SHA-256, used as its clip ID. */
export async function fileId(file: Blob): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
  return Array.from(digest.subarray(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** 16 kHz mono 16-bit PCM of the whole file, or null when it has no sound track the browser can decode. */
export async function audioPcm(file: Blob): Promise<Int16Array | null> {
  try {
    const decoded = await new AudioContext().decodeAudioData(await file.arrayBuffer());
    const ctx = new OfflineAudioContext(1, Math.ceil(decoded.duration * RATE), RATE);
    const src = ctx.createBufferSource();
    src.buffer = decoded;
    src.connect(ctx.destination);
    src.start();
    const f = (await ctx.startRendering()).getChannelData(0);
    return Int16Array.from(f, (x) => Math.max(-32768, Math.min(32767, Math.round(x * 32767))));
  } catch {
    return null;
  }
}

const base64 = (bytes: Uint8Array): string => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Steps a hidden video through whole seconds, giving a 512 px JPEG and the change from the previous frame (32x18 grey, as the CLI computes it). */
export class FrameReader {
  private readonly video: HTMLVideoElement;
  private readonly big = document.createElement("canvas");
  private readonly small = document.createElement("canvas");
  private prev: Uint8ClampedArray | null = null;
  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.small.width = 32;
    this.small.height = 18;
  }
  async frame(tMs: number): Promise<{ tMs: number; diff: number; jpegDataUrl: string }> {
    const v = this.video;
    await new Promise<void>((resolve, reject) => {
      v.onseeked = () => resolve();
      v.onerror = () => reject(new Error("The video could not be read."));
      v.currentTime = tMs / 1000;
    });
    this.big.width = FRAME_WIDTH;
    this.big.height = Math.round((FRAME_WIDTH * v.videoHeight) / v.videoWidth / 2) * 2;
    this.big.getContext("2d")!.drawImage(v, 0, 0, this.big.width, this.big.height);
    const sctx = this.small.getContext("2d", { willReadFrequently: true })!;
    sctx.drawImage(v, 0, 0, 32, 18);
    const rgba = sctx.getImageData(0, 0, 32, 18).data;
    const grey = new Uint8ClampedArray(32 * 18).map((_, i) => 0.299 * rgba[i * 4]! + 0.587 * rgba[i * 4 + 1]! + 0.114 * rgba[i * 4 + 2]!);
    let diff = 0;
    if (this.prev) {
      for (let i = 0; i < grey.length; i++) diff += Math.abs(grey[i]! - this.prev[i]!);
      diff /= grey.length * 255;
    }
    this.prev = grey;
    return { tMs, diff, jpegDataUrl: this.big.toDataURL("image/jpeg", 0.8) };
  }
}

/** The request body for one chunk. */
export function chunkBody(uploadId: string, startMs: number, endMs: number, frames: { tMs: number; diff: number; jpegDataUrl: string }[], pcm: Int16Array | null) {
  const audio = pcm?.subarray(Math.floor((startMs * RATE) / 1000), Math.ceil((endMs * RATE) / 1000));
  return { uploadId, startMs, endMs, frames, ...(audio?.length ? { audioPcm16: base64(new Uint8Array(audio.buffer, audio.byteOffset, audio.byteLength)) } : {}) };
}

/** Validates a relay answer (trust boundary) and moves its chunk-local scenes to clip time. */
export function placeChunk(answer: unknown, uploadId: string, startMs: number, endMs: number): { decisions: Decisions; products: Product[] } {
  const a = answer as { decisions?: unknown; products?: unknown };
  const d = validateDecisions(a?.decisions);
  if (!d.ok || d.value.clipId !== uploadId || d.value.durationMs !== endMs - startMs) throw new Error("The relay sent an answer that does not match this part of the video.");
  const products = (Array.isArray(a.products) ? a.products : []).flatMap((p) => {
    const r = validateProduct(p);
    return r.ok ? [r.value] : [];
  });
  const scenes = d.value.scenes.map((s): DecisionScene => ({ ...s, id: `s${String(s.startMs + startMs).padStart(7, "0")}`, startMs: (s.startMs + startMs) as DecisionScene["startMs"], endMs: (s.endMs + startMs) as DecisionScene["endMs"] }));
  return { decisions: { ...d.value, scenes }, products };
}

/** All chunks so far as one decisions object; unanalyzed time has no scene, so a pause there says analysis unavailable. */
export function mergeChunks(clip: Manifest, chunks: readonly Decisions[]): Decisions | null {
  const first = chunks[0];
  if (!first) return null;
  return { ...first, clipId: clip.clipId, durationMs: clip.durationMs, scenes: chunks.flatMap((c) => c.scenes).sort((x, y) => x.startMs - y.startMs) };
}
