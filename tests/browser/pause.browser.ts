import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { validateDecisions, validateManifest, validateProduct } from "../../packages/bundle-schema/src/index.ts";
import { resolvePause } from "../../packages/policy/src/index.ts";
import { REASON_TEXT } from "../../apps/web/src/pause-view.ts";

const CLIP = "000000000001";
const read = (p: string): unknown => JSON.parse(readFileSync(new URL(`../../${p}`, import.meta.url), "utf8"));
const unwrap = <T>(r: { ok: true; value: T } | { ok: false }): T => (r.ok ? r.value : (() => { throw new Error("invalid fixture"); })());
const decisions = unwrap(validateDecisions(read(`data/decisions/${CLIP}.json`)));
const manifest = unwrap(validateManifest(read(`data/manifest/${CLIP}.json`)));

/** What the overlay must say at `tMs`, from the same resolvePause the app calls. */
function expectedText(tMs: number): string {
  const r = resolvePause(decisions, tMs);
  if (r.outcome !== "ad") return REASON_TEXT[r.outcome];
  return unwrap(validateProduct(read(`data/products/${r.scene.topProductId}.json`))).name;
}

// Mid-scene times for each outcome, plus 50 ms and 300 ms after a boundary, where the 1 s look-back still holds the previous scene.
const PAUSES_MS = [2000, 5050, 12000, 17000, 22000, 30300, 33000];

test("each pause shows the resolvePause outcome within 500 ms, with no request after load", async ({ page }) => {
  const late: string[] = [];
  let loaded = false;
  page.on("request", (r) => { if (loaded) late.push(r.url()); });
  await page.goto(`#/clip/${CLIP}`);
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() => (document.querySelector("video")?.readyState ?? 0) >= 3);
  loaded = true;

  for (const tMs of PAUSES_MS) {
    const result = await page.evaluate(async (t) => {
      const v = document.querySelector("video")!;
      v.muted = true;
      await v.play();
      v.currentTime = t / 1000;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
      const t0 = performance.now();
      v.pause();
      const frameMs = Math.round(v.currentTime * 1000);
      for (;;) {
        const text = document.querySelector(".bg-frozen-scrim")?.textContent ?? "";
        if (text) return { ms: performance.now() - t0, frameMs, text };
        if (performance.now() - t0 > 2000) return { ms: Infinity, frameMs, text };
        await new Promise((r) => requestAnimationFrame(r));
      }
    }, tMs);
    expect.soft(result.ms, `overlay at ${tMs} ms`).toBeLessThan(500);
    expect.soft(result.text, `text at ${result.frameMs} ms`).toContain(expectedText(result.frameMs));
  }

  // The video itself may stream in range requests; nothing else (no API, model, font or image) may load after start.
  const video = new URL(manifest.videoUrl, "http://localhost:4173/pausall/").href;
  expect(late.filter((u) => u !== video)).toEqual([]);
});
