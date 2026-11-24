// Usage: pnpm vlm-check <video> [<video> ...]   Story 4.1: one multi-image request per clip to each candidate VLM,
// plus one request with the frames as a video part, printing latency, tokens, cost and the description. Never writes files.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Ledger, postJson } from "./call.ts";
import { Qwen, readKeys } from "./clients.ts";
import { loadPipelineConfig } from "./config.ts";

const root = resolve(import.meta.dirname, "../../..");
const CANDIDATES = ["qwen3.7-flash", "qwen3.7-plus"];
const PROMPT = "Describe this video scene in 2 to 4 sentences: setting, people and actions, objects, mood. Mention any violence, injury, death, sexual content, medical emergency, children or heated argument. Paraphrase any text; do not quote it.";
const cfg = loadPipelineConfig(root);
const keys = readKeys(join(root, ".env"));
const ledger = new Ledger(cfg.costCapUsd);
const qwen = new Qwen(keys.qwenBaseUrl, keys.qwenKey, { retry: { timeoutMs: cfg.timeoutMs, retries: 1 }, prices: cfg.pricesUsdPerMillionTokens, ledger });

for (const video of process.argv.slice(2)) {
  const tmp = mkdtempSync(join(tmpdir(), "pausal-vlm-"));
  try {
    // 6 frames, 1 per second, from the middle of the clip.
    const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString());
    execFileSync("ffmpeg", ["-v", "error", "-ss", String(Math.max(0, dur / 2 - 3)), "-t", "6", "-i", video, "-vf", `fps=1,scale=${cfg.frameWidth}:-2`, "-q:v", "4", join(tmp, "f%02d.jpg")]);
    const urls = readdirSync(tmp).sort().map((f) => `data:image/jpeg;base64,${readFileSync(join(tmp, f)).toString("base64")}`);
    console.log(`\n== ${video} (${urls.length} frames from ${(dur / 2 - 3).toFixed(0)} s)`);
    for (const model of CANDIDATES) {
      const before = ledger.stages[model]?.costUsd ?? 0;
      const t0 = Date.now();
      const text = await qwen.chat(model, [{ role: "user", content: [...urls.map((url) => ({ type: "image_url" as const, image_url: { url } })), { type: "text" as const, text: PROMPT }] }], model);
      const u = ledger.stages[model];
      console.log(`-- ${model}: ${Date.now() - t0} ms, ${u?.inputTokens} in / ${u?.outputTokens} out so far, $${((u?.costUsd ?? 0) - before).toFixed(5)}\n${text}`);
    }
    // Is a frame list accepted as a video part? Only the answer matters, not the text.
    try {
      await postJson(
        `${keys.qwenBaseUrl.replace(/\/$/, "")}/chat/completions`,
        { authorization: `Bearer ${keys.qwenKey}` },
        { model: CANDIDATES[0], enable_thinking: false, max_tokens: 20, messages: [{ role: "user", content: [{ type: "video", video: urls }, { type: "text", text: "One word: what is shown?" }] }] },
        { timeoutMs: cfg.timeoutMs, retries: 0 },
      );
      console.log(`-- video part with ${urls.length} frames: accepted`);
    } catch (e) {
      console.log(`-- video part: rejected (${e instanceof Error ? e.message.slice(0, 160) : String(e)})`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
console.log(`\ntotal $${ledger.totalUsd.toFixed(5)}`);
