// One chunk of an uploaded video, analyzed by the relay (docs/upload-plan.md). Pure apart from the model calls it is given.
import { createHash } from "node:crypto";
import type { Decisions, Product, Thresholds } from "@pausal/bundle-schema";
import { analyzeClip, type AnalyzeOptions, type Catalog, type ClipInput, type Models } from "./analyze.ts";
import { simulatedCampaign, toProduct } from "./catalog.ts";
import { deriveDecisions } from "./decide.ts";

export const MAX_CHUNK_MS = 20_000;
export const MAX_CLIP_MS = 180_000;
const RATE = 16_000;
const MAX_FRAME_CHARS = 400_000;

/** What the browser sends: frames at 1 per second and, when the file has sound, 16 kHz mono 16-bit PCM for the same range. */
export type ChunkRequest = {
  uploadId: string;
  startMs: number;
  endMs: number;
  frames: { tMs: number; diff: number; jpegDataUrl: string }[];
  audioPcm16?: string;
};

/** Chunk decisions in chunk-local time (0 to endMs - startMs), so the browser can validate them as one decisions file, and the products they name. */
export type ChunkResult = { decisions: Decisions; products: Product[] };

/** Rejects anything the relay should not spend money on. Returns an error message, or null when the request is usable. */
export function checkChunk(r: unknown): string | null {
  if (!r || typeof r !== "object") return "body must be a JSON object";
  const c = r as Partial<ChunkRequest>;
  if (typeof c.uploadId !== "string" || !/^[0-9a-f]{12}$/.test(c.uploadId)) return "uploadId must be 12 lowercase hex characters";
  if (!Number.isInteger(c.startMs) || !Number.isInteger(c.endMs)) return "startMs and endMs must be integers";
  const start = c.startMs as number, end = c.endMs as number;
  if (start < 0 || end <= start || end - start > MAX_CHUNK_MS || end > MAX_CLIP_MS) return `chunk must lie within the first ${MAX_CLIP_MS / 1000} s and last at most ${MAX_CHUNK_MS / 1000} s`;
  if (!Array.isArray(c.frames) || c.frames.length === 0 || c.frames.length > MAX_CHUNK_MS / 1000 + 1) return "frames must hold 1 to 21 frames";
  for (const f of c.frames) {
    if (!f || typeof f.tMs !== "number" || f.tMs < start || f.tMs >= end) return "every frame time must lie inside the chunk";
    if (typeof f.diff !== "number" || !(f.diff >= 0 && f.diff <= 1)) return "frame diff must be between 0 and 1";
    if (typeof f.jpegDataUrl !== "string" || !f.jpegDataUrl.startsWith("data:image/jpeg;base64,") || f.jpegDataUrl.length > MAX_FRAME_CHARS) return "frames must be JPEG data URLs under 300 KB";
  }
  if (c.audioPcm16 !== undefined) {
    const maxChars = Math.ceil((((end - start) / 1000) * RATE * 2 * 4) / 3) + 8;
    if (typeof c.audioPcm16 !== "string" || c.audioPcm16.length > maxChars) return "audioPcm16 must be base64 PCM for the chunk's length";
  }
  return null;
}

/** Silent stretches as ffmpeg's silencedetect finds them (noise -30 dB, at least 0.5 s), in ms. */
export function silences(pcm: Int16Array, rate = RATE): [number, number][] {
  const limit = 32768 * 10 ** (-30 / 20);
  const minRun = rate / 2;
  const out: [number, number][] = [];
  let runStart = -1;
  for (let i = 0; i <= pcm.length; i++) {
    const quiet = i < pcm.length && Math.abs(pcm[i] as number) < limit;
    if (quiet && runStart < 0) runStart = i;
    if (!quiet && runStart >= 0) {
      if (i - runStart >= minRun) out.push([Math.round((runStart * 1000) / rate), Math.round((i * 1000) / rate)]);
      runStart = -1;
    }
  }
  return out;
}

/** A 16 kHz mono WAV file around raw PCM, as a data URL for the speech model. */
export function wavDataUrl(pcm: Int16Array, rate = RATE): string {
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + pcm.byteLength, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(rate, 24);
  head.writeUInt32LE(rate * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(pcm.byteLength, 40);
  return `data:audio/wav;base64,${Buffer.concat([head, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength)]).toString("base64")}`;
}

const sha = (v: unknown) => createHash("sha256").update(JSON.stringify(v)).digest("hex");

/**
 * Analyzes one checked chunk and runs decide on it.
 * shortcut: each chunk starts with no relevance history from the previous chunk, so the first scenes of a chunk blend no earlier fits; pass the last 3 fit maps across if chunks start to disagree visibly.
 */
export async function analyzeChunk(
  req: ChunkRequest,
  deps: { models: Models; catalog: Catalog; opts: AnalyzeOptions; thresholds: Thresholds; transcribeWav?: (wavDataUrl: string) => Promise<string>; imageBase: string },
): Promise<ChunkResult> {
  const lengthMs = req.endMs - req.startMs;
  const frames = req.frames.map((f) => ({ ...f, tMs: f.tMs - req.startMs })).sort((a, b) => a.tMs - b.tMs);
  let dialogueCutsMs: number[] = [];
  let transcribe: ClipInput["transcribe"];
  if (req.audioPcm16 && deps.transcribeWav) {
    const bytes = Buffer.from(req.audioPcm16, "base64");
    const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
    const quiet = silences(pcm);
    dialogueCutsMs = quiet.flat().filter((t) => t > 0 && t < lengthMs);
    const speak = deps.transcribeWav;
    transcribe = async (span) => {
      if (quiet.some(([a, b]) => a <= span.startMs && b >= span.endMs)) return "";
      return speak(wavDataUrl(pcm.subarray(Math.floor((span.startMs * RATE) / 1000), Math.ceil((span.endMs * RATE) / 1000))));
    };
  }
  const analysis = await analyzeClip({ clipId: req.uploadId, durationMs: lengthMs, frames, dialogueCutsMs, ...(transcribe ? { transcribe } : {}) }, deps.models, deps.catalog, deps.opts);
  const byId = new Map(deps.catalog.items.map((i) => [i.id, i]));
  const fitIds = [...new Set(analysis.scenes.flatMap((s) => (s.fits ?? []).map((f) => f.productId)))];
  const campaigns = fitIds.map(simulatedCampaign);
  const products = new Map(fitIds.flatMap((id) => {
    const item = byId.get(id);
    return item ? [[id, { ...toProduct(item), imagePath: `${deps.imageBase}/products/${id}.jpg` }] as const] : [];
  }));
  const decisions = deriveDecisions(analysis, deps.thresholds, campaigns, products, { analysisHash: sha(analysis), thresholdsHash: sha(deps.thresholds), campaignsHash: sha(campaigns) });
  const named = new Set(decisions.scenes.flatMap((s) => s.ranked.map((r) => r.productId)));
  return { decisions, products: [...products.values()].filter((p) => named.has(p.id)) };
}
