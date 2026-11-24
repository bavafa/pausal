import { CATEGORIES, sceneId, type Analysis, type Int, type AnalysisScene, type Fit, type Thresholds } from "@pausall/bundle-schema";
import { checkTagline, evaluateScene } from "@pausall/policy";
import { CostCapError } from "./call.ts";
import { toProduct, topK, type CatalogItem } from "./catalog.ts";
import type { SceneJudge, SceneJudgment } from "./judge.ts";
import { chunkOf, segment, type Span } from "./segment.ts";

/** Everything a run needs, passed in as data so a later server can call this without a file system (AD-13). */
export type ClipInput = {
  clipId: string;
  durationMs: number;
  /** Sampled frames about 1 per second; `diff` is the change from the previous frame (0 to 1). */
  frames: { tMs: number; diff: number; jpegDataUrl: string }[];
  /** Speech boundaries; empty when the manifest says no dialogue. */
  dialogueCutsMs: number[];
  /** Present only for clips with dialogue. Held in memory and passed to describe only, never stored or judged (AD-5). */
  transcribe?: (span: Span) => Promise<string>;
};

export type Models = {
  describe(frames: string[], dialogue: string | undefined): Promise<string>;
  embed(text: string): Promise<number[]>;
  tagline(product: CatalogItem, description: string): Promise<string>;
  jev: SceneJudge;
  qwen: SceneJudge;
};

export type Catalog = { items: readonly CatalogItem[]; vectors: Float32Array; dims: number };

export type AnalyzeOptions = {
  sceneCapMs: number;
  chunkMs: number;
  frameChangeThreshold: number;
  candidates: number;
  thresholds: Thresholds;
  modelNames: Record<string, string>;
};

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e)).slice(0, 300);

/** Previous-scene weights for the ranking window (FR-7, AD-17): the current scene counts 1. */
const PREVIOUS_WEIGHTS = [0.5, 0.25, 0.125];

/** Relevance (0 to 100, raw) blends this scene's fit with the same product's fit in up to 3 earlier scenes; ranking only, never safety. */
export function relevanceWithContext(currentP: number, previous: readonly (ReadonlyMap<string, number> | undefined)[], productId: string): number {
  let sum = currentP;
  let weight = 1;
  PREVIOUS_WEIGHTS.forEach((w, k) => {
    const p = previous[k]?.get(productId);
    if (p !== undefined) {
      sum += w * p;
      weight += w;
    }
  });
  return (100 * sum) / weight;
}

/** Feature names that share a word of 4 or more letters with the description; only these reach reason lines (AD-7). */
export function matchedFeatures(features: readonly string[], description: string): string[] {
  const words = new Set(description.toLowerCase().match(/[a-z]{4,}/g) ?? []);
  return features.filter((f) => (f.toLowerCase().match(/[a-z]{4,}/g) ?? []).some((w) => words.has(w)));
}

/** AD-7: the tagline gate is R1, R2, R5 and R6 at thresholds relaxed by `taglineGateMargin`. */
export function passesTaglineGate(scene: AnalysisScene, t: Thresholds): boolean {
  const m = t.taglineGateMargin;
  const relaxed: Thresholds = {
    ...t,
    safetyConfidence: t.safetyConfidence - m,
    categoryCutoffs: Object.fromEntries(CATEGORIES.map((c) => [c, t.categoryCutoffs[c] + m])) as Thresholds["categoryCutoffs"],
  };
  const failed = evaluateScene(scene, relaxed, []).failed;
  return !failed.some((r) => r === "R1" || r === "R2" || r === "R5" || r === "R6");
}

/** Runs segment, describe, judge, retrieve, fit and tagline for one clip. Stage failures become typed scene errors (AD-22); a cost cap aborts the run. */
export async function analyzeClip(input: ClipInput, models: Models, catalog: Catalog, opts: AnalyzeOptions, log: (s: string) => void = () => {}): Promise<Analysis> {
  const spans = segment(input.frames, input.dialogueCutsMs, input.durationMs, opts.sceneCapMs, opts.frameChangeThreshold);
  const scenes: AnalysisScene[] = [];
  const fitHistory: (Map<string, number> | undefined)[] = [];

  for (const span of spans) {
    const scene: AnalysisScene = { id: sceneId(span.startMs), startMs: span.startMs, endMs: span.endMs, chunk: chunkOf(span.startMs, opts.chunkMs), status: "ok", judgments: null, invalid: [] };
    scenes.push(scene);
    const fail = (stage: string, e: unknown) => {
      if (e instanceof CostCapError) throw e;
      scene.status = "error";
      scene.error = { stage, message: message(e) };
      log(`${scene.id}: ${stage} failed: ${scene.error.message}`);
    };
    // Every frame inside the scene, plus the nearest one for scenes shorter than a sample step.
    let frames = input.frames.filter((f) => f.tMs >= span.startMs && f.tMs < span.endMs);
    if (frames.length === 0) {
      const nearest = [...input.frames].sort((a, b) => Math.abs(a.tMs - span.startMs) - Math.abs(b.tMs - span.startMs))[0];
      frames = nearest ? [nearest] : [];
    }

    let description: string;
    try {
      if (frames.length === 0) throw new Error("no sampled frame in this scene");
      const dialogue = input.transcribe ? await input.transcribe(span) : undefined;
      description = await models.describe(frames.map((f) => f.jpegDataUrl), dialogue);
      scene.description = description;
    } catch (e) {
      fail("describe", e);
      fitHistory.unshift(undefined);
      continue;
    }

    let jev: SceneJudgment | undefined;
    let qwen: SceneJudgment | undefined;
    const [jr, qr] = await Promise.allSettled([models.jev.judgeScene(description), models.qwen.judgeScene(description)]);
    for (const r of [jr, qr]) if (r.status === "rejected" && r.reason instanceof CostCapError) throw r.reason;
    if (jr.status === "fulfilled") jev = jr.value;
    if (qr.status === "fulfilled") qwen = qr.value;
    // Scene type and sentiment come from Jev; Qwen covers them only when Jev errors, and never stands in for Jev's safety verdict (AD-6).
    const labels = jev ?? qwen;
    if (labels) {
      scene.sceneType = labels.sceneType;
      scene.sentimentLevel = labels.sentimentLevel;
    }
    if (jev && qwen) scene.judgments = { jev: jev.judgment, qwen: qwen.judgment };
    else fail("judge", jr.status === "rejected" ? `jev: ${message(jr.reason)}` : `qwen: ${message(qr.status === "rejected" ? qr.reason : "")}`);

    try {
      const query = await models.embed(description);
      const hits = topK(query, catalog.vectors, catalog.dims, opts.candidates);
      const candidates = hits.map((h) => catalog.items[h.index] as CatalogItem);
      const fitP = await models.jev.judgeFit(description, candidates);
      const current = new Map(candidates.map((c, i) => [c.id, fitP[i] as number]));
      scene.fits = candidates.map(
        (c, i): Fit => ({
          productId: c.id,
          jevFitP: fitP[i] as number,
          embeddingSim: Math.max(-1, Math.min(1, (hits[i] as { sim: number }).sim)),
          relevance: relevanceWithContext(fitP[i] as number, fitHistory.slice(0, 3), c.id),
          matched: matchedFeatures(c.keyFeatures, description),
        }),
      );
      fitHistory.unshift(current);
    } catch (e) {
      fitHistory.unshift(undefined);
      fail("fit", e);
      continue;
    }

    if (scene.status === "ok" && passesTaglineGate(scene, opts.thresholds)) {
      const top = [...scene.fits].sort((a, b) => b.relevance - a.relevance || (a.productId < b.productId ? -1 : 1))[0];
      const item = top && catalog.items.find((i) => i.id === top.productId);
      if (item) {
        try {
          const tagline = (await models.tagline(item, description)).trim();
          scene.tagline = tagline;
          scene.taglineCheck = checkTagline(tagline, toProduct(item)) ? "pass" : "fail";
        } catch (e) {
          // A missing tagline is not a scene failure: decisions fall back to the product name (AD-7).
          if (e instanceof CostCapError) throw e;
          log(`${scene.id}: tagline failed: ${message(e)}`);
        }
      }
    }
    log(`${scene.id} ${scene.status} ${scene.sceneType?.primary ?? "-"} jev=${scene.judgments?.jev.verdict ?? "-"} qwen=${scene.judgments?.qwen.verdict ?? "-"}`);
  }
  return { clipId: input.clipId, durationMs: input.durationMs as Int, models: opts.modelNames, scenes };
}
