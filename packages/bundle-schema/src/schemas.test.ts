import { describe, expect, it } from "vitest";
import sceneTypesJson from "../../../config/scene-types.json" with { type: "json" };
import {
  CATEGORIES,
  checkTimeline,
  sceneId,
  validateAnalysis,
  validateCampaigns,
  validateDecisions,
  validateManifest,
  validateProduct,
  validateSceneTypes,
  validateThresholds,
  type Result,
} from "./index.ts";

const sceneTypes = ["kitchen", "beach"];
type J = Record<string, any>;

const judgment = (): J => ({
  status: "ok",
  verdict: "safe",
  confidence: 0.9,
  categories: Object.fromEntries(CATEGORIES.map((c) => [c, { flagged: false, p: 0.1 }])),
});
const analysisScene = (startMs: number, endMs: number): J => ({
  id: sceneId(startMs),
  startMs,
  endMs,
  chunk: 1,
  status: "ok",
  description: "Two people cook pasta.",
  sceneType: { primary: "kitchen", freeLabel: "home kitchen" },
  sentimentLevel: 4,
  judgments: { jev: judgment(), qwen: judgment() },
  fits: [{ productId: "B000P1", jevFitP: 0.8, embeddingSim: 0.4, relevance: 72.5, matched: ["Flat base"] }],
  tagline: "Cook more.",
  taglineCheck: "pass",
});
const analysis = (): J => ({
  clipId: "a1b2c3d4",
  durationMs: 3000,
  models: { vlm: "qwen3-vl-8b-2026-10", jev: "jev-2026-09-01" },
  scenes: [analysisScene(0, 1500), analysisScene(1500, 3000)],
});
const decisionScene = (startMs: number, endMs: number): J => ({
  id: sceneId(startMs),
  startMs,
  endMs,
  outcome: "ad",
  topProductId: "B000P1",
  price: { cents: 120, simulated: true },
  split: { platformCents: 84, publisherCents: 36, simulated: true },
  ranked: [{ productId: "B000P1", relevance: 72, reason: "Fits a kitchen scene.", bid: null }],
  panel: { contextLabel: { primary: "kitchen" }, moodLabel: "Warm", sentiment: 0.5, safeTag: "safe" },
  tagline: "Cook more.",
});
const decisions = (): J => ({
  clipId: "a1b2c3d4",
  durationMs: 3000,
  analysisHash: "h1",
  thresholdsHash: "h2",
  campaignsHash: "h3",
  holdMs: 5000,
  scenes: [decisionScene(0, 1500), { ...decisionScene(1500, 3000), outcome: "nothingFits", topProductId: null, price: null, split: null, tagline: undefined }],
});
const thresholds = (): J => ({
  safetyConfidence: 0.8,
  relevance: 60,
  r3b: { jevFitP: 0.6, embeddingSim: 0.3 },
  categoryCutoffs: Object.fromEntries(CATEGORIES.map((c) => [c, 0.5])),
  holdMs: 5000,
  taglineGateMargin: 0.05,
  pricing: { relevanceWeight: 0.5 },
});
const manifest = (): J => ({
  clipId: "a1b2c3d4",
  title: "Kitchen",
  videoUrl: "videos/a1b2c3d4.mp4",
  durationMs: 3000,
  aiGenerated: true,
  hasDialogue: false,
  attributionKey: "sample-1",
});
const product = (): J => ({ id: "B000P1", name: "Pan", imagePath: "img/B000P1.jpg", description: "A pan.", keyFeatures: ["Nonstick"], attribution: "abo" });
const campaigns = (): J[] => [{ productId: "B000P1", bidCents: 50, budgetCents: 10000, active: true }];

function paths<T>(r: Result<T>): string[] {
  expect(r.ok).toBe(false);
  return r.ok ? [] : r.issues.map((i) => i.path);
}
const roundtrip = (v: unknown) => JSON.parse(JSON.stringify(v));

describe("valid files pass", () => {
  it.each([
    ["manifest", () => validateManifest(manifest())],
    ["analysis", () => validateAnalysis(analysis(), sceneTypes)],
    ["decisions", () => validateDecisions(roundtrip(decisions()))],
    ["product", () => validateProduct(product())],
    ["thresholds", () => validateThresholds(thresholds())],
    ["campaigns", () => validateCampaigns(campaigns())],
    ["config/scene-types.json", () => validateSceneTypes(sceneTypesJson)],
  ])("%s", (_name, run) => {
    const r = run() as Result<unknown>;
    expect(r.ok ? [] : r.issues).toEqual([]);
  });

  it("analysis scenes carry empty invalid lists and their judgments", () => {
    const r = validateAnalysis(analysis(), sceneTypes);
    if (!r.ok) throw new Error("expected ok");
    expect(r.value.scenes.map((s) => s.invalid)).toEqual([[], []]);
    expect(r.value.scenes[0]?.judgments?.jev.verdict).toBe("safe");
  });

  it("decisions scene type has no description key", () => {
    const r = validateDecisions(roundtrip(decisions()));
    if (!r.ok) throw new Error("expected ok");
    const scene = r.value.scenes[0]!;
    // @ts-expect-error decisions scenes never carry a description (AD-2)
    expect(scene.description).toBeUndefined();
    const ms: number = scene.startMs + scene.endMs + (scene.price?.cents ?? 0) + (scene.ranked[0]?.relevance ?? 0);
    expect(ms).toBe(1500 + 120 + 72);
  });
});

describe("failing files", () => {
  it("manifest with a non-boolean aiGenerated", () => {
    expect(paths(validateManifest({ ...manifest(), aiGenerated: "yes", durationMs: null }))).toEqual(["durationMs", "aiGenerated"]);
  });
  it("product with empty name and non-string feature", () => {
    expect(paths(validateProduct({ ...product(), name: "", keyFeatures: [3] }))).toEqual(["name", "keyFeatures[0]"]);
  });
  it("campaigns duplicated by product", () => {
    expect(paths(validateCampaigns([...campaigns(), ...campaigns()]))).toEqual(["[1].productId"]);
  });
  it("scene types empty, duplicated or blank", () => {
    expect(paths(validateSceneTypes([]))).toEqual(["(root)"]);
    expect(paths(validateSceneTypes(["a", "a", " "]))).toEqual(["[1]", "[2]"]);
    expect(paths(validateSceneTypes(Array.from({ length: 256 }, (_, i) => `t${i}`)))).toEqual(["(root)"]);
  });
  it("non-object roots", () => {
    for (const r of [validateManifest(null), validateAnalysis([], sceneTypes), validateDecisions("x"), validateProduct(1), validateThresholds(undefined), validateCampaigns({})]) {
      expect(paths(r as Result<unknown>)).toEqual(["(root)"]);
    }
  });
  it("analysis scene type outside the list and unpinned model", () => {
    const a = analysis();
    a.scenes[0].sceneType.primary = "spaceship";
    a.models.jev = "jev-latest";
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["models.jev", "scenes[0].sceneType.primary"]);
  });
  it("analysis ok scene missing content fails the file; pending scene may omit it", () => {
    const a = analysis();
    delete a.scenes[0].description;
    a.scenes[1] = { id: "s0001500", startMs: 1500, endMs: 3000, chunk: 1, status: "pending" };
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["scenes[0].description"]);
    delete a.scenes[0].tagline;
    delete a.scenes[0].taglineCheck;
    a.scenes[0].description = "x";
    const r = validateAnalysis(a, sceneTypes);
    expect(r.ok && r.value.scenes[1]?.invalid).toEqual(["judgments: is missing"]);
  });
  it.each([
    ["scenes[0].fits[0].relevance", (a: J) => void (a.scenes[0].fits[0].relevance = 101)],
    ["scenes[0].fits[0].embeddingSim", (a: J) => void (a.scenes[0].fits[0].embeddingSim = 1.5)],
    ["scenes[0].fits[0].jevFitP", (a: J) => void (a.scenes[0].fits[0].jevFitP = -0.1)],
    ["scenes[0].fits[0].matched", (a: J) => void delete a.scenes[0].fits[0].matched],
    ["scenes[0].fits[0].matched[0]", (a: J) => void (a.scenes[0].fits[0].matched = [""])],
    ["scenes[0].sentimentLevel", (a: J) => void (a.scenes[0].sentimentLevel = 6)],
    ["scenes[0].sceneType.secondary", (a: J) => void (a.scenes[0].sceneType.secondary = "spaceship")],
    ["scenes[0].chunk", (a: J) => void (a.scenes[0].chunk = 0)],
    ["models", (a: J) => void (a.models = {})],
  ])("analysis content field %s", (field, mutate) => {
    const a = analysis();
    mutate(a);
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual([field]);
  });
  it("error object required for status error and rejected otherwise", () => {
    const a = analysis();
    a.scenes[0].status = "error";
    a.scenes[1].error = { stage: "describe", message: "timeout" };
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["scenes[0].error", "scenes[1].error"]);
    a.scenes[0].error = a.scenes[1].error;
    delete a.scenes[1].error;
    expect(validateAnalysis(a, sceneTypes).ok).toBe(true);
  });
  it("startMs beyond 7 digits", () => {
    const a = { ...analysis(), durationMs: 10_000_500, scenes: [analysisScene(0, 10_000_000), analysisScene(10_000_000, 10_000_500)] };
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["scenes[1].startMs"]);
  });
  it("tagline without taglineCheck", () => {
    const a = analysis();
    delete a.scenes[0].taglineCheck;
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["scenes[0].taglineCheck"]);
  });
});

describe("timeline (AD-16)", () => {
  const withTimes = (times: [number, number][]) => ({ ...analysis(), scenes: times.map(([s, e]) => analysisScene(s, e)) });
  it.each([
    ["gap", [[0, 1000], [1500, 3000]], ["scenes[1]"]],
    ["overlap", [[0, 2000], [1500, 3000]], ["scenes[1]"]],
    ["unsorted", [[1500, 3000], [0, 1500]], ["scenes[0]", "scenes[1]", "scenes[1]"]],
    ["short", [[0, 1500], [1500, 2900]], ["scenes[1]"]],
    ["empty", [], ["scenes"]],
  ] as [string, [number, number][], string[]][])("%s fails analysis and decisions", (_name, times, expected) => {
    expect(paths(validateAnalysis(withTimes(times), sceneTypes))).toEqual(expected);
    const d = { ...decisions(), scenes: times.map(([s, e]) => decisionScene(s, e)) };
    expect(paths(validateDecisions(d))).toEqual(expected);
  });
  it("checkTimeline accepts an exact tiling", () => {
    expect(checkTimeline([{ startMs: 0, endMs: 10 }, { startMs: 10, endMs: 20 }], 20)).toEqual([]);
  });
});

describe("bad judgment invalidates one scene only (AD-15)", () => {
  it.each([
    ["missing intenseDialogue", (j: J) => void delete j.categories.intenseDialogue],
    ["null p", (j: J) => void (j.categories.sexual.p = null)],
    ["status error", (j: J) => void (j.status = "error")],
  ])("%s on jev or qwen", (_name, mutate) => {
    for (const judge of ["jev", "qwen"]) {
      const a = analysis();
      mutate(a.scenes[1].judgments[judge]);
      const r = validateAnalysis(a, sceneTypes);
      if (!r.ok) throw new Error(JSON.stringify(r.issues));
      const [s0, s1] = r.value.scenes;
      expect(s1?.judgments).toBeNull();
      expect(s1?.invalid.length).toBeGreaterThan(0);
      expect(s1?.invalid[0]).toContain(`judgments.${judge}`);
      expect(s0?.invalid).toEqual([]);
      expect(s0?.judgments).not.toBeNull();
    }
  });
});

describe("lax thresholds (AD-20)", () => {
  it.each([
    ["safetyConfidence", (t: J) => void (t.safetyConfidence = 0.79)],
    ["relevance", (t: J) => void (t.relevance = 49)],
    ["r3b.embeddingSim", (t: J) => void delete t.r3b.embeddingSim],
    ["categoryCutoffs.violence", (t: J) => void (t.categoryCutoffs.violence = 0.51)],
    ["holdMs", (t: J) => void (t.holdMs = 4999)],
    ["taglineGateMargin", (t: J) => void (t.taglineGateMargin = null)],
    ["pricing.relevanceWeight", (t: J) => void (t.pricing.relevanceWeight = 1.01)],
    ["pricing", (t: J) => void delete t.pricing],
  ])("%s", (field, mutate) => {
    const t = thresholds();
    mutate(t);
    expect(paths(validateThresholds(t))).toEqual([field]);
  });
});

describe("bad units or IDs (AD-10)", () => {
  it("startMs 1.5 and id s12", () => {
    const a = analysis();
    a.scenes[0].startMs = 1.5;
    a.scenes[1].id = "s12";
    expect(paths(validateAnalysis(a, sceneTypes))).toEqual(["scenes[0].startMs", "scenes[1].id"]);
  });
  it("bidCents 9.99", () => {
    expect(paths(validateCampaigns([{ ...campaigns()[0], bidCents: 9.99 }]))).toEqual(["[0].bidCents"]);
  });
  it("fractional cents and relevance in decisions", () => {
    const d = roundtrip(decisions());
    d.scenes[0].price.cents = 1.2;
    d.scenes[0].ranked[0].relevance = 72.5;
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].price.cents", "scenes[0].ranked[0].relevance"]);
  });
  it("clip ID that is not a hash prefix", () => {
    expect(paths(validateManifest({ ...manifest(), clipId: "My Clip" }))).toEqual(["clipId"]);
  });
});

describe("leaky decisions (AD-2, AD-7, AD-8)", () => {
  it("scene with description", () => {
    const d = roundtrip(decisions());
    d.scenes[0].description = "Two people cook pasta.";
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].description"]);
  });
  it("tagline on a no-ad outcome", () => {
    const d = roundtrip(decisions());
    d.scenes[1].tagline = "Cook more.";
    expect(paths(validateDecisions(d))).toEqual(["scenes[1].tagline"]);
  });
  it("money without simulated: true", () => {
    const d = roundtrip(decisions());
    delete d.scenes[0].price.simulated;
    d.scenes[0].split.simulated = false;
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].price.simulated", "scenes[0].split.simulated"]);
  });
  it("ad outcome without a price", () => {
    const d = roundtrip(decisions());
    d.scenes[0].price = null;
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].price"]);
  });
  it("unknown keys at top level and nested", () => {
    const d = roundtrip(decisions());
    d.extra = 1;
    d.scenes[0].panel.reasons = "x";
    expect(paths(validateDecisions(d))).toEqual(["extra", "scenes[0].panel.reasons"]);
  });
  it("price and split on a no-ad outcome", () => {
    const d = roundtrip(decisions());
    d.scenes[1].price = { cents: 0, simulated: true };
    d.scenes[1].split = { platformCents: 0, publisherCents: 0, simulated: true };
    expect(paths(validateDecisions(d))).toEqual(["scenes[1].price", "scenes[1].split"]);
  });
  it("split that does not add up to the price", () => {
    const d = roundtrip(decisions());
    d.scenes[0].split.publisherCents = 35;
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].split"]);
  });
  it("topProductId other than ranked[0]", () => {
    const d = roundtrip(decisions());
    d.scenes[0].topProductId = "B000P2";
    d.scenes[1].topProductId = "B000P2";
    expect(paths(validateDecisions(d))).toEqual(["scenes[0].topProductId", "scenes[1].topProductId"]);
  });
  it("missing holdMs, empty reason line and more than 10 ranked products", () => {
    const d = roundtrip(decisions());
    delete d.holdMs;
    d.scenes[0].ranked[0].reason = "";
    d.scenes[1].ranked = Array.from({ length: 11 }, (_, i) => ({ productId: i ? `P${i}` : d.scenes[1].ranked[0].productId, relevance: 50, reason: "r", bid: null }));
    d.scenes[0].ranked[0].bid = { cents: 5 };
    expect(paths(validateDecisions(d))).toEqual(["holdMs", "scenes[0].ranked[0].bid.simulated", "scenes[0].ranked[0].reason", "scenes[1].ranked"]);
  });
  it("unknown reason and sentiment off the table", () => {
    const d = roundtrip(decisions());
    d.scenes[1].outcome = "tooSpicy";
    d.scenes[1].panel.sentiment = 0.3;
    expect(paths(validateDecisions(d))).toEqual(["scenes[1].outcome", "scenes[1].panel.sentiment"]);
  });
});
