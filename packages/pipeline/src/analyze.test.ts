import { describe, expect, it } from "vitest";
import { CATEGORIES, validateAnalysis, validateCampaigns, validateSceneTypes, validateThresholds, type Judgment, type Result } from "@pausall/bundle-schema";
import { evaluateScene } from "@pausall/policy";
import thresholdsJson from "../../../config/thresholds.json" with { type: "json" };
import sceneTypesJson from "../../../config/scene-types.json" with { type: "json" };
import { analyzeClip, matchedFeatures, passesTaglineGate, relevanceWithContext, type Models } from "./analyze.ts";
import { CostCapError, Ledger } from "./call.ts";
import { sliceCatalog, toCatalogItem, topK, type CatalogItem } from "./catalog.ts";
import { shuffled, type SceneJudge, type SceneJudgment } from "./judge.ts";
import { chunkOf, segment } from "./segment.ts";

const ok = <T>(r: Result<T>): T => (r.ok ? r.value : expect.fail(JSON.stringify(r.issues)));
const thresholds = ok(validateThresholds(thresholdsJson));
const sceneTypes = ok(validateSceneTypes(sceneTypesJson));

describe("segment", () => {
  it("cuts at frame changes, dialogue changes and the 8 s cap, tiling the clip", () => {
    const frames = Array.from({ length: 25 }, (_, i) => ({ tMs: i * 1000, diff: i === 5 ? 0.4 : 0.01 }));
    const spans = segment(frames, [7500], 25_000, 8000, 0.1);
    expect(spans.map((s) => [s.startMs, s.endMs])).toEqual([
      [0, 5000],
      [5000, 7500],
      [7500, 13_333],
      [13_333, 19_167],
      [19_167, 25_000],
    ]);
    expect(spans.every((s) => s.endMs - s.startMs <= 8000 && Number.isInteger(s.startMs))).toBe(true);
  });
  it("puts the first 20 s in chunk 1", () => {
    expect([chunkOf(0, 20_000), chunkOf(19_999, 20_000), chunkOf(20_000, 20_000)]).toEqual([1, 1, 2]);
  });
});

describe("fit helpers", () => {
  it("blends up to 3 previous scenes for the same product only", () => {
    expect(relevanceWithContext(0.8, [], "p")).toBeCloseTo(80);
    expect(relevanceWithContext(0.8, [new Map([["p", 0.2]]), undefined, new Map([["q", 1]])], "p")).toBeCloseTo((100 * (0.8 + 0.5 * 0.2)) / 1.5);
  });
  it("matches features by shared words of 4 or more letters", () => {
    expect(matchedFeatures(["Flat base", "28 cm", "Cast iron"], "A cook uses a pan with a flat bottom on the base of the stove")).toEqual(["Flat base"]);
  });
  it("shuffles deterministically", () => {
    expect(shuffled(sceneTypes, "x")).toEqual(shuffled(sceneTypes, "x"));
    expect(shuffled(sceneTypes, "x")).not.toEqual(sceneTypes);
  });
});

describe("catalog", () => {
  const listing = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
    item_id: id,
    item_name: [{ language_tag: "en_US", value: name }],
    bullet_point: [{ language_tag: "en_US", value: "Holds 1 litre" }],
    main_image_id: "img",
    product_type: [{ value: "KITCHEN" }],
    ...extra,
  });
  it("keeps English listings with a bullet and an image, deduped by name in item ID order", () => {
    expect(toCatalogItem({ ...listing("a", "Kettle"), main_image_id: undefined })).toBeNull();
    expect(toCatalogItem(listing("a", "Ketel", { item_name: [{ language_tag: "nl_NL", value: "Ketel" }] }))).toBeNull();
    const items = ["c", "b", "a"].map((id) => toCatalogItem(listing(id, id === "a" ? "Pan" : "Kettle")) as CatalogItem);
    expect(sliceCatalog(items, 10).map((i) => i.id)).toEqual(["a", "b"]);
  });
  it("retrieves by cosine similarity", () => {
    expect(topK([1, 0], new Float32Array([0, 1, 1, 0.1, -1, 0]), 2, 2).map((h) => h.index)).toEqual([1, 0]);
  });
});

const judgment = (verdict: Judgment["verdict"], confidence = 0.95, p = 0.02): Judgment => ({
  status: "ok",
  verdict,
  confidence,
  categories: Object.fromEntries(CATEGORIES.map((c) => [c, { flagged: p >= 0.5, p }])) as Judgment["categories"],
});
const sj = (verdict: Judgment["verdict"], primary = "kitchen"): SceneJudgment => ({ sceneType: { primary }, sentimentLevel: 4, judgment: judgment(verdict) });
const judge = (scene: (d: string) => Promise<SceneJudgment>, fit: SceneJudge["judgeFit"] = async (_d, c) => c.map(() => 0.9)): SceneJudge => ({ judgeScene: scene, judgeFit: fit });

const items: CatalogItem[] = [
  { id: "p1", name: "Pan", productType: "KITCHEN", description: "A pan.", keyFeatures: ["Flat base"], imageId: "i1" },
  { id: "p2", name: "Lamp", productType: "LAMP", description: "A lamp.", keyFeatures: ["Warm light"], imageId: "i2" },
];
const catalog = { items, vectors: new Float32Array([1, 0, 0, 1]), dims: 2 };
const frames = Array.from({ length: 12 }, (_, i) => ({ tMs: i * 1000, diff: i === 6 ? 0.5 : 0, jpegDataUrl: `frame${i}` }));
const opts = { sceneCapMs: 8000, chunkMs: 20_000, frameChangeThreshold: 0.1, candidates: 2, thresholds, modelNames: { vlm: "qwen3.7-flash", jev: "jev-1.14.0" } };
const baseModels = (over: Partial<Models> = {}): Models => ({
  describe: async (f) => `A cook at a kitchen counter with a flat pan (${f.length} frames).`,
  embed: async () => [1, 0],
  tagline: async () => "A steady pan for everyday cooking.",
  jev: judge(async () => sj("safe")),
  qwen: judge(async () => sj("safe", "dining room")),
  ...over,
});

describe("analyzeClip", () => {
  it("writes a valid analysis where a safe scene with a good fit gets an ad and a tagline", async () => {
    const a = await analyzeClip({ clipId: "abcdef012345", durationMs: 12_000, frames, dialogueCutsMs: [] }, baseModels(), catalog, opts);
    const v = ok(validateAnalysis(JSON.parse(JSON.stringify(a)), sceneTypes));
    expect(v.scenes.map((s) => [s.id, s.startMs, s.endMs])).toEqual([["s0000000", 0, 6000], ["s0006000", 6000, 12_000]]);
    const s = v.scenes[0]!;
    expect(s.description).toContain("6 frames");
    expect(s.fits?.[0]).toMatchObject({ productId: "p1", jevFitP: 0.9, embeddingSim: 1, matched: ["Flat base"] });
    expect(s.tagline).toBe("A steady pan for everyday cooking.");
    expect(evaluateScene(s, thresholds, ok(validateCampaigns([{ productId: "p1", bidCents: 100, budgetCents: 100, active: true }]))).outcome).toBe("ad");
  });

  it("fails a scene closed when a frame cannot be described, and never judges it", async () => {
    let judged = 0;
    const models = baseModels({
      describe: async () => Promise.reject(new Error("a frame could not be described")),
      jev: judge(async () => (judged++, sj("safe"))),
    });
    const a = await analyzeClip({ clipId: "abcdef012345", durationMs: 6000, frames: frames.slice(0, 6), dialogueCutsMs: [] }, models, catalog, opts);
    expect(a.scenes[0]).toMatchObject({ status: "error", error: { stage: "describe" }, judgments: null });
    expect(judged).toBe(0);
    expect(evaluateScene(ok(validateAnalysis(JSON.parse(JSON.stringify(a)), sceneTypes)).scenes[0]!, thresholds, []).outcome).toBe("analysisUnavailable");
  });

  it("uses Qwen labels when Jev errors but never a Qwen safety verdict in its place", async () => {
    const models = baseModels({ jev: judge(async () => Promise.reject(new Error("HTTP 500"))) });
    const a = await analyzeClip({ clipId: "abcdef012345", durationMs: 6000, frames: frames.slice(0, 6), dialogueCutsMs: [] }, models, catalog, opts);
    const s = a.scenes[0]!;
    expect(s).toMatchObject({ status: "error", error: { stage: "judge" }, judgments: null, sceneType: { primary: "dining room" } });
    expect(s.tagline).toBeUndefined();
    expect(evaluateScene(ok(validateAnalysis(JSON.parse(JSON.stringify(a)), sceneTypes)).scenes[0]!, thresholds, []).outcome).toBe("analysisUnavailable");
  });

  it("keeps Qwen's safety answer when Qwen names a scene type outside the list", async () => {
    const models = baseModels({ qwen: judge(async () => ({ ...sj("safe"), sceneType: null })) });
    const a = await analyzeClip({ clipId: "abcdef012345", durationMs: 6000, frames: frames.slice(0, 6), dialogueCutsMs: [] }, models, catalog, opts);
    expect(a.scenes[0]).toMatchObject({ status: "ok", sceneType: { primary: "kitchen" } });
    expect(a.scenes[0]?.judgments?.qwen.verdict).toBe("safe");
  });

  it("writes no tagline for a scene that fails the gate, and passes transcripts to describe only", async () => {
    const seen: string[] = [];
    const models = baseModels({
      describe: async (_f, dialogue) => (seen.push(dialogue ?? ""), "Two people argue loudly in a kitchen."),
      jev: judge(async (d) => (seen.push(d), sj("caution"))),
      tagline: async () => expect.fail("no tagline call for a gated scene"),
    });
    const a = await analyzeClip({ clipId: "abcdef012345", durationMs: 6000, frames: frames.slice(0, 6), dialogueCutsMs: [], transcribe: async () => "SECRET TRANSCRIPT" }, models, catalog, opts);
    expect(a.scenes[0]?.tagline).toBeUndefined();
    expect(seen).toEqual(["SECRET TRANSCRIPT", "Two people argue loudly in a kitchen."]);
    expect(JSON.stringify(a)).not.toContain("SECRET TRANSCRIPT");
  });

  it("aborts the run at the cost cap", async () => {
    const ledger = new Ledger(0.01);
    ledger.add("describe", 1, 1, 0.02);
    const models = baseModels({ describe: async () => (ledger.guard(), "never") });
    await expect(analyzeClip({ clipId: "abcdef012345", durationMs: 6000, frames: frames.slice(0, 6), dialogueCutsMs: [] }, models, catalog, opts)).rejects.toBeInstanceOf(CostCapError);
  });

  it("relaxes the tagline gate by the margin only", () => {
    const scene = { id: "s0000000", startMs: 0, endMs: 1000, chunk: 1, status: "ok" as const, description: "d", sceneType: { primary: "kitchen" }, sentimentLevel: 3 as const, fits: [], invalid: [] };
    const at = (confidence: number) => passesTaglineGate({ ...scene, judgments: { jev: judgment("safe", confidence), qwen: judgment("safe") } } as never, thresholds);
    expect(at(thresholds.safetyConfidence - thresholds.taglineGateMargin)).toBe(true);
    expect(at(thresholds.safetyConfidence - thresholds.taglineGateMargin - 0.01)).toBe(false);
  });
});
