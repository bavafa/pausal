// Usage: pnpm analyze <clip-id> [--out <file>] [--skip-hash]
// Reads data/manifest/<clip-id>.json and its video under apps/web/public, writes data/analysis/<clip-id>.json and prints cost per stage.
// --skip-hash is only for hand-made test clips whose ID is not a hash prefix.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { validateAnalysis, validateManifest, validateSceneTypes, validateThresholds } from "@pausal/bundle-schema";
import { analyzeClip, type ClipInput } from "./analyze.ts";
import { Ledger } from "./call.ts";
import { loadCatalog } from "./catalog-cli.ts";
import { Jev, Qwen, readKeys } from "./clients.ts";
import { loadPipelineConfig } from "./config.ts";
import { canonicalJson } from "./decide.ts";
import { makeModels } from "./models.ts";

const root = resolve(import.meta.dirname, "../../..");
const args = process.argv.slice(2);
const clipId = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--out");
const outArg = args.indexOf("--out");
if (!clipId) {
  console.error("usage: pnpm analyze <clip-id> [--out <file>] [--skip-hash]");
  process.exit(1);
}
const out = outArg === -1 ? join(root, "data/analysis", `${clipId}.json`) : resolve(args[outArg + 1] ?? "");

const readJson = (p: string): unknown => JSON.parse(readFileSync(join(root, p), "utf8"));
const must = <T>(r: { ok: true; value: T } | { ok: false; issues: { path: string; message: string }[] }, file: string): T => {
  if (!r.ok) throw new Error(`${file}: ${r.issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
  return r.value;
};
const manifest = must(validateManifest(readJson(`data/manifest/${clipId}.json`)), `data/manifest/${clipId}.json`);
const sceneTypes = must(validateSceneTypes(readJson("config/scene-types.json")), "config/scene-types.json");
const thresholds = must(validateThresholds(readJson("config/thresholds.json")), "config/thresholds.json");
const cfg = loadPipelineConfig(root);
const video = join(root, "apps/web/public", manifest.videoUrl);
const bytes = readFileSync(video);
const hash = createHash("sha256").update(bytes).digest("hex");
if (!args.includes("--skip-hash") && !hash.startsWith(clipId)) throw new Error(`clip ID ${clipId} is not the prefix of the video hash ${hash.slice(0, 12)} (AD-10)`);

// Ingest with ffmpeg: duration, 1 fps JPEG frames at frameWidth, and tiny grey frames for change detection.
const run = (cmd: string, a: string[]): Buffer => execFileSync(cmd, a, { maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "pipe"] });
const durationMs = Math.round(Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString().trim()) * 1000);
if (durationMs !== manifest.durationMs) throw new Error(`manifest durationMs ${manifest.durationMs} differs from the video's ${durationMs}`);
const tmp = mkdtempSync(join(tmpdir(), "pausal-"));
try {
  run("ffmpeg", ["-v", "error", "-i", video, "-vf", `fps=1,scale=${cfg.frameWidth}:-2`, "-q:v", "4", join(tmp, "f%05d.jpg")]);
  const jpegs = readdirSync(tmp).filter((f) => f.endsWith(".jpg")).sort();
  const W = 32 * 18;
  const grey = run("ffmpeg", ["-v", "error", "-i", video, "-vf", "fps=1,scale=32:18,format=gray", "-f", "rawvideo", "-"]);
  const frames: ClipInput["frames"] = jpegs.map((f, i) => {
    let diff = 0;
    if (i > 0 && grey.length >= (i + 1) * W) {
      for (let k = 0; k < W; k++) diff += Math.abs((grey[i * W + k] as number) - (grey[(i - 1) * W + k] as number));
      diff /= W * 255;
    }
    return { tMs: i * 1000, diff, jpegDataUrl: `data:image/jpeg;base64,${readFileSync(join(tmp, f)).toString("base64")}` };
  }).filter((f) => f.tMs < durationMs);

  const keys = readKeys(join(root, ".env"));
  const ledger = new Ledger(cfg.costCapUsd);
  const clientCfg = { retry: { timeoutMs: cfg.timeoutMs, retries: cfg.retries }, prices: cfg.pricesUsdPerMillionTokens, ledger };
  const qwen = new Qwen(keys.qwenBaseUrl, keys.qwenKey, clientCfg);
  const jev = new Jev(keys.jevKey, cfg.models.jev, clientCfg);

  // Dialogue: speech boundaries from silence detection, and a per-scene transcript that never leaves memory (AD-5).
  const hasAudio = run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", video]).toString().trim() !== "";
  let dialogueCutsMs: number[] = [];
  let transcribe: ClipInput["transcribe"];
  if (manifest.hasDialogue && !hasAudio) throw new Error(`manifest says ${clipId} has dialogue but the video has no audio track`);
  if (manifest.hasDialogue) {
    // silencedetect reports on stderr; speech starts and ends are the dialogue change points.
    const err = spawnSync("ffmpeg", ["-nostats", "-i", video, "-af", "silencedetect=noise=-30dB:d=0.5", "-f", "null", "-"], { encoding: "utf8" }).stderr;
    dialogueCutsMs = [...err.matchAll(/silence_(?:start|end): ([\d.]+)/g)].map((m) => Math.round(Number(m[1]) * 1000)).filter((t) => t > 0 && t < durationMs);
    // Silent intervals; a trailing silence with no end runs to the end of the clip.
    const silences: [number, number][] = [];
    for (const m of err.matchAll(/silence_(start|end): ([\d.]+)/g)) {
      const t = Math.round(Number(m[2]) * 1000);
      if (m[1] === "start") silences.push([t, durationMs]);
      else if (silences.length) (silences.at(-1) as [number, number])[1] = t;
    }
    transcribe = async (span) => {
      if (silences.some(([a, b]) => a <= span.startMs && b >= span.endMs)) return "";
      const wav = run("ffmpeg", ["-v", "error", "-ss", String(span.startMs / 1000), "-to", String(span.endMs / 1000), "-i", video, "-ac", "1", "-ar", "16000", "-f", "wav", "-"]);
      const content = [{ type: "input_audio" as const, input_audio: { data: `data:audio/wav;base64,${wav.toString("base64")}` } }];
      // A failed call fails the describe stage, so a scene is never judged without its speech; an empty answer means no speech (music, noise).
      return qwen.chat(cfg.models.speech, [{ role: "user", content }], "transcribe", false, true);
    };
  }

  const models = makeModels(qwen, jev, cfg, sceneTypes);

  const catalog = loadCatalog();
  if (catalog.meta.model !== cfg.models.embedding) throw new Error(`index was built with ${catalog.meta.model}, config pins ${cfg.models.embedding}; run pnpm abo build`);
  const t0 = Date.now();
  const analysis = await analyzeClip(
    { clipId, durationMs, frames, dialogueCutsMs, ...(transcribe ? { transcribe } : {}) },
    models,
    { items: catalog.items, vectors: catalog.vectors, dims: catalog.meta.dimensions },
    { ...cfg, thresholds, modelNames: Object.fromEntries(Object.entries(cfg.models).filter(([role]) => role !== "speech" || transcribe)) },
    (s) => console.log(s),
  );
  // Cost per stage goes into analysis so eval can report cost per clip minute (AD-22, Story 5.3).
  const usage = Object.fromEntries(Object.entries(ledger.stages).map(([k, u]) => [k, { ...u, costUsd: Number(u.costUsd.toFixed(6)) }]));
  Object.assign(analysis, { usage });
  must(validateAnalysis(analysis, sceneTypes), out);
  writeFileSync(out, canonicalJson(analysis));
  console.log(`analyze: wrote ${out}: ${analysis.scenes.length} scenes in ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
  console.log(`cost: $${ledger.totalUsd.toFixed(4)} of a $${cfg.costCapUsd} cap. ${JSON.stringify(ledger.stages)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
