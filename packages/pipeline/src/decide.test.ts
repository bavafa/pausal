import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAnalysis, validateCampaigns, validateDecisions, validateProduct, validateSceneTypes, validateThresholds, type Decisions, type Product, type Result } from "@pausal/bundle-schema";
import analysisJson from "../../../data/analysis/000000000001.json" with { type: "json" };
import thresholdsJson from "../../../config/thresholds.json" with { type: "json" };
import campaignsJson from "../../../config/campaigns.json" with { type: "json" };
import sceneTypesJson from "../../../config/scene-types.json" with { type: "json" };
import panJson from "../../../data/products/fixture-pan.json" with { type: "json" };
import kettleJson from "../../../data/products/fixture-kettle.json" with { type: "json" };
import lampJson from "../../../data/products/fixture-lamp.json" with { type: "json" };
import { canonicalJson, deriveDecisions, productIssues } from "./decide.ts";

const ok = <T>(r: Result<T>): T => (r.ok ? r.value : expect.fail(JSON.stringify(r.issues)));
const products = new Map<string, Product>([panJson, kettleJson, lampJson].map((p) => [p.id, ok(validateProduct(p))]));
const hashes = { analysisHash: "a", thresholdsHash: "t", campaignsHash: "c" };
const derive = (mutate: (a: Record<string, any>) => void = () => {}): Decisions => {
  const a = structuredClone(analysisJson) as Record<string, any>;
  mutate(a);
  const analysis = ok(validateAnalysis(a, ok(validateSceneTypes(sceneTypesJson))));
  return deriveDecisions(analysis, ok(validateThresholds(thresholdsJson)), ok(validateCampaigns(campaignsJson)), products, hashes);
};
const scene = (d: Decisions, id: string) => d.scenes.find((s) => s.id === id) ?? expect.fail(`no scene ${id}`);

describe("deriveDecisions on the fixture", () => {
  const d = derive();

  it.each([
    ["s0000000", "ad"],
    ["s0005000", "sensitiveScene"],
    ["s0010000", "nothingFits"],
    ["s0015000", "noActiveCampaign"],
    ["s0020000", "analysisUnavailable"],
    ["s0025000", "sensitiveScene"], // prompt injection quoted in the description
    ["s0030000", "ad"],
  ])("%s gives %s", (id, outcome) => expect(scene(d, id).outcome).toBe(outcome));

  it("an ad carries price, split and a passing tagline", () => {
    const s = scene(d, "s0000000");
    expect(s.price).toEqual({ cents: 108, simulated: true });
    expect(s.split).toEqual({ platformCents: 76, publisherCents: 32, simulated: true });
    expect(s.tagline).toBe("A steady pan for weeknight cooking.");
  });

  it("reason lines use the scene type and only features in the product file, in product order", () => {
    expect(scene(d, "s0000000").ranked.map((r) => r.reason)).toEqual(["Fits a kitchen scene: 28 cm, Flat base.", "Fits a kitchen scene: Gooseneck spout."]);
    expect(scene(d, "s0030000").ranked[0]?.reason).toBe("Fits a cooking scene: Flat base.");
    expect(JSON.stringify(d)).not.toContain("evil.example");
  });

  it("copies holdMs from the thresholds", () => expect(d.holdMs).toBe(thresholdsJson.holdMs));

  it("the output validates", () => ok(validateDecisions(d)));

  it("a failing tagline falls back to the product name", () => expect(scene(d, "s0030000").tagline).toBe("Everyday Skillet"));

  it("no-ad scenes carry no price, split or tagline", () => {
    for (const s of d.scenes.filter((s) => s.outcome !== "ad")) {
      expect([s.price, s.split, s.tagline]).toEqual([null, null, undefined]);
    }
  });

  it("panel comes from scene type, sentiment and the worse judge", () => {
    expect(scene(d, "s0005000").panel).toEqual({ contextLabel: { primary: "kitchen", secondary: "fight or conflict" }, moodLabel: "Tense", sentiment: -1, safeTag: "unsafe" });
    expect(scene(d, "s0020000").panel).toEqual({ contextLabel: { primary: "Unavailable" }, moodLabel: "Unavailable", sentiment: 0, safeTag: "caution" });
  });

  it("passes validateDecisions and never carries a description", () => {
    expect(validateDecisions(d).ok).toBe(true);
    expect(canonicalJson(d)).not.toMatch(/description|ignore the rules/);
  });

  it("an analysisUnavailable scene gets the Unavailable panel even with panel inputs present", () => {
    const pending = derive((a) => void Object.assign(a.scenes[4], { sceneType: { primary: "kitchen" }, sentimentLevel: 4, judgments: structuredClone(a.scenes[0].judgments) }));
    expect(scene(pending, "s0020000").outcome).toBe("analysisUnavailable");
    expect(scene(pending, "s0020000").panel).toEqual({ contextLabel: { primary: "Unavailable" }, moodLabel: "Unavailable", sentiment: 0, safeTag: "caution" });
  });

  it("a tagline on a no-ad scene is dropped", () => {
    const sensitive = derive((a) => void (a.scenes[1].tagline = "A pan.", a.scenes[1].taglineCheck = "pass"));
    expect(scene(sensitive, "s0005000").tagline).toBeUndefined();
  });

  it("is deterministic", () => expect(canonicalJson(derive())).toBe(canonicalJson(d)));
});

describe("canonicalJson", () => {
  it("sorts keys at every depth, 2-space indent, trailing newline", () => {
    expect(canonicalJson({ b: 1, a: [{ d: 1, c: { f: 1, e: 2 } }] })).toBe(
      '{\n  "a": [\n    {\n      "c": {\n        "e": 2,\n        "f": 1\n      },\n      "d": 1\n    }\n  ],\n  "b": 1\n}\n',
    );
  });
});

describe("productIssues (AD-19)", () => {
  const d = derive();
  it("passes when files match references", () => expect(productIssues([d], ["fixture-pan", "fixture-kettle", "fixture-lamp"])).toEqual([]));
  it("names a referenced ID without a file and an orphan file", () => {
    expect(productIssues([d], ["fixture-pan", "fixture-kettle", "orphan"])).toEqual([
      { path: "fixture-lamp", message: "is referenced in decisions but has no product file" },
      { path: "orphan", message: "has a product file but is not referenced in any decisions" },
    ]);
  });
});

describe("decide CLI", () => {
  const cli = fileURLToPath(new URL("./decide-cli.ts", import.meta.url));
  const repo = fileURLToPath(new URL("../../../", import.meta.url));
  const dec = "data/decisions/000000000001.json";
  const run = (root: string, ...args: string[]) => spawnSync(process.execPath, [cli, "--root", root, ...args], { encoding: "utf8" });
  /** A temp copy of config/, data/ and the web public folder, so failure paths never touch committed files. */
  // The catalog and raw sample clips are gigabytes and decide never reads them; copying them filled the disk.
  const skip = [join(repo, "data/catalog"), join(repo, "data/samples")];
  const roots: string[] = [];
  afterAll(() => roots.forEach((r) => rmSync(r, { recursive: true, force: true })));
  const tempRoot = (): string => {
    const root = mkdtempSync(join(tmpdir(), "decide-"));
    roots.push(root);
    for (const d of ["config", "data", "apps/web/public"])
      cpSync(join(repo, d), join(root, d), { recursive: true, filter: (src) => !skip.some((s) => src === s || src.startsWith(s + "/")) });
    return root;
  };

  it("--check passes on the committed fixture", () => {
    const r = run(tempRoot(), "--check");
    expect(r.stderr).toBe("");
    expect(r.status).toBe(0);
  });

  it.each([
    ["one changed byte", "differs", (root: string) => writeFileSync(join(root, dec), readFileSync(join(root, dec), "utf8").replace('"cents": 108', '"cents": 109'))],
    ["a deleted decisions file", "is missing", (root: string) => rmSync(join(root, dec))],
    ["an extra decisions file", "has no analysis file", (root: string) => writeFileSync(join(root, "data/decisions/000000000002.json"), "{}\n")],
    ["a missing clip video", "videoUrl: no file", (root: string) => rmSync(join(root, "apps/web/public/media/000000000001.mp4"))],
    ["a missing product image", "imagePath: no file", (root: string) => rmSync(join(root, "apps/web/public/products/fixture-pan.svg"))],
  ])("--check fails on %s", (_, message, mutate) => {
    const root = tempRoot();
    mutate(root);
    const r = run(root, "--check");
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(message);
  });

  it("a manifest durationMs mismatch fails and writes nothing", () => {
    const root = tempRoot();
    const manifest = join(root, "data/manifest/000000000001.json");
    writeFileSync(manifest, readFileSync(manifest, "utf8").replace('"durationMs": 35000', '"durationMs": 36000'));
    rmSync(join(root, dec));
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("must equal analysis durationMs");
    expect(existsSync(join(root, dec))).toBe(false);
  });
});

describe("sameFamily", () => {
  it("groups sizes and colours of one product and keeps different designs apart", async () => {
    const { sameFamily } = await import("./catalog.ts");
    const pump = (size: string) => `206 Collective Women's Battelle Closed-Toe Covered Wedge Pump, Neutral patent leather, ${size} C/D US`;
    expect(sameFamily(pump("7"), pump("12"))).toBe(true);
    expect(sameFamily('Amazon Brand – Rivet American Forest Map Wall Art Print in White Wood Frame, 20" x 20"', 'Amazon Brand – Rivet American Forest Map Wall Art Print in Gold Wood Frame, 12" x 12"')).toBe(true);
    expect(sameFamily("AmazonBasics 1/4-Inch Yoga and Exercise Mat with Carrying Strap, Black", 'AmazonBasics Yoga & Exercise Mat with Carrying Strap, 1/4", Green')).toBe(true);
    expect(sameFamily("Amazon Brand - Symbol Men's Grey Sneakers - 8 UK/India (42 EU)(AZ-SH-39A)", "Amazon Brand - Symbol Men's Grey Sneakers-6 UK/India (40 EU)(AZ-OM-53B)")).toBe(true);
    expect(sameFamily('Amazon Brand - Solimo 12" Wall Clock - Ethereal Roman (Silent Movement)', 'Amazon Brand - Solimo 12" Wall Clock - Classic Roulette (Silent Movement)')).toBe(false);
    expect(sameFamily("Kettle", "Skillet")).toBe(false);
  });

  it("drops a hit whose catalog vector is a near copy of one already kept", async () => {
    const { distinctHits } = await import("./catalog.ts");
    const items = [{ name: "Forest print" }, { name: "Lake photo" }, { name: "Kettle" }, { name: "Forest print, white frame" }];
    const vectors = new Float32Array([1, 0, 0.99, 0.1, 0, 1, 0.6, 0.8]);
    const hits = [0, 1, 2, 3].map((index) => ({ index }));
    expect(distinctHits(hits, items, vectors, 2, 5).map((h) => h.index)).toEqual([0, 2]);
    expect(distinctHits(hits, items, vectors, 2, 1).map((h) => h.index)).toEqual([0]);
  });
});
