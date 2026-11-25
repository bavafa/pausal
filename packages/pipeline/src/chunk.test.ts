import { describe, expect, it } from "vitest";
import { CATEGORIES, validateDecisions, validateProduct, validateThresholds, type Judgment, type Result } from "@pausal/bundle-schema";
import thresholdsJson from "../../../config/thresholds.json" with { type: "json" };
import type { Models } from "./analyze.ts";
import type { CatalogItem } from "./catalog.ts";
import { analyzeChunk, checkChunk, silences, wavDataUrl, type ChunkRequest } from "./chunk.ts";

const ok = <T>(r: Result<T>): T => (r.ok ? r.value : expect.fail(JSON.stringify(r.issues)));
const thresholds = ok(validateThresholds(thresholdsJson));
const judgment = (verdict: Judgment["verdict"]): Judgment => ({ status: "ok", verdict, confidence: 0.95, categories: Object.fromEntries(CATEGORIES.map((c) => [c, { flagged: false, p: 0.02 }])) as Judgment["categories"] });
const judge = { judgeScene: async () => ({ sceneType: { primary: "kitchen" }, sentimentLevel: 4 as const, judgment: judgment("safe") }), judgeFit: async (_d: string, c: readonly CatalogItem[]) => c.map(() => 0.9) };
const items: CatalogItem[] = [
  { id: "p1", name: "Pan", productType: "KITCHEN", description: "A pan.", keyFeatures: ["Flat base"], imageId: "i1" },
  { id: "p2", name: "Lamp", productType: "LAMP", description: "A lamp.", keyFeatures: ["Warm light"], imageId: "i2" },
];
const heard: string[] = [];
const models: Models = { describe: async (_f, d) => `A cook at a counter with a flat pan.${d ? ` Speech: ${d}` : ""}`, embed: async () => [1, 0], tagline: async () => "A steady pan for everyday cooking.", photoFits: async () => true, jev: judge, qwen: judge };
const deps = {
  models,
  catalog: { items, vectors: new Float32Array([1, 0, 0, 1]), dims: 2 },
  opts: { sceneCapMs: 8000, chunkMs: 20_000, frameChangeThreshold: 0.1, candidates: 2, thresholds, modelNames: { vlm: "qwen3.7-flash" } },
  thresholds,
  transcribeWav: async (url: string) => (heard.push(url.slice(0, 22)), "hello"),
  imageBase: "https://images.example",
  shortNames: new Map([["p1", "Flat pan"]]),
};
const frame = (tMs: number) => ({ tMs, diff: 0, jpegDataUrl: "data:image/jpeg;base64,AAAA" });
const req = (over: Partial<ChunkRequest> = {}): ChunkRequest => ({ uploadId: "abcdef012345", startMs: 20_000, endMs: 30_000, frames: Array.from({ length: 10 }, (_, i) => frame(20_000 + i * 1000)), ...over });

describe("checkChunk", () => {
  it("accepts a well-formed chunk and rejects ones the relay should not pay for", () => {
    expect(checkChunk(req())).toBeNull();
    expect(checkChunk(req({ uploadId: "x" }))).toMatch(/uploadId/);
    expect(checkChunk(req({ endMs: 50_000 }))).toMatch(/at most 20 s/);
    expect(checkChunk(req({ startMs: 175_000, endMs: 185_000 }))).toMatch(/first 180 s/);
    expect(checkChunk(req({ frames: [frame(5000)] }))).toMatch(/inside the chunk/);
    expect(checkChunk(req({ frames: [{ ...frame(20_000), jpegDataUrl: "data:image/png;base64,AA" }] }))).toMatch(/JPEG/);
    expect(checkChunk(req({ audioPcm16: "A".repeat(1_000_000) }))).toMatch(/audioPcm16/);
  });
});

describe("audio helpers", () => {
  it("finds silences of at least half a second", () => {
    const pcm = new Int16Array(32_000).fill(5000);
    pcm.fill(0, 8000, 20_000); // 0.75 s quiet
    pcm.fill(0, 24_000, 27_000); // 0.19 s quiet, too short
    expect(silences(pcm)).toEqual([[500, 1250]]);
  });
  it("wraps PCM in a 16 kHz mono WAV header", () => {
    const bytes = Buffer.from(wavDataUrl(new Int16Array(10)).split(",")[1] as string, "base64");
    expect([bytes.toString("ascii", 0, 4), bytes.readUInt32LE(24), bytes.readUInt32LE(40)]).toEqual(["RIFF", 16_000, 20]);
  });
});

describe("analyzeChunk", () => {
  it("returns chunk-local decisions the browser can validate, with R2 product images", async () => {
    const pcm = new Int16Array(160_000).fill(5000);
    const r = await analyzeChunk(req({ audioPcm16: Buffer.from(pcm.buffer).toString("base64") }), deps);
    const d = ok(validateDecisions(JSON.parse(JSON.stringify(r.decisions))));
    expect([d.clipId, d.durationMs, d.scenes[0]?.startMs, d.scenes.at(-1)?.endMs]).toEqual(["abcdef012345", 10_000, 0, 10_000]);
    expect(d.scenes[0]?.outcome).toBe("ad");
    expect(heard[0]).toBe("data:audio/wav;base64,");
    expect(r.products.map((p) => ok(validateProduct(p)).imagePath)).toContain("https://images.example/products/p1.jpg");
    expect(r.products.find((p) => p.id === "p1")?.shortName).toBe("Flat pan");
  });
});
