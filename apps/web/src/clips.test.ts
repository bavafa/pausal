import { describe, expect, it, vi } from "vitest";
import { loadClips, loadDecisions, assetUrl } from "./clips.ts";
import { parseRoute, productHref } from "./route.ts";

const manifest = (clipId: string, title: string) => ({ aiGenerated: true, attributionKey: "x", clipId, durationMs: 1000, hasDialogue: false, title, videoUrl: "v.mp4" });

describe("loadClips", () => {
  it("keeps valid manifests sorted by title and leaves out invalid ones", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const clips = loadClips({ a: manifest("000000000002", "B"), b: manifest("000000000003", "A"), c: { title: "broken" } });
    expect(clips.map((c) => c.title)).toEqual(["A", "B"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("c"), expect.anything());
    warn.mockRestore();
  });
  it("loads the committed fixture manifest", () => {
    expect(loadClips().map((c) => c.clipId)).toContain("000000000001");
  });
  it("gives an empty list when no manifest is valid", () => {
    expect(loadClips({})).toEqual([]);
  });
});

describe("parseRoute", () => {
  it("maps hashes to pages", () => {
    expect(parseRoute("")).toEqual({ page: "picker" });
    expect(parseRoute("#/")).toEqual({ page: "picker" });
    expect(parseRoute("#/clip/000000000001")).toEqual({ page: "clip", clipId: "000000000001" });
    expect(parseRoute("#/clip/zzz")).toEqual({ page: "clip", clipId: "zzz" });
    expect(parseRoute("#/clip/a/product/p")).toEqual({ page: "product", clipId: "a", productId: "p" });
    expect(parseRoute(productHref("a b", "p/q"))).toEqual({ page: "product", clipId: "a b", productId: "p/q" });
    expect(parseRoute("#/clip/a/x")).toEqual({ page: "picker" });
  });
});

describe("loadDecisions", () => {
  const clip = loadClips().find((c) => c.clipId === "000000000001")!;
  const good = loadDecisions(clip);
  const quiet = () => vi.spyOn(console, "warn").mockImplementation(() => {});

  it("loads the committed fixture decisions", () => {
    expect(good?.scenes.length).toBeGreaterThan(0);
  });
  it("gives null for missing, invalid or mismatched decisions", () => {
    const warn = quiet();
    expect(loadDecisions(clip, {})).toBeNull();
    expect(loadDecisions(clip, { "x/000000000001.json": { clipId: "000000000001" } })).toBeNull();
    expect(loadDecisions({ ...clip, durationMs: 1 as typeof clip.durationMs }, { "x/000000000001.json": good })).toBeNull();
    expect(loadDecisions({ ...clip, clipId: "000000000009" }, { "x/000000000009.json": good })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(4);
    warn.mockRestore();
  });
});

describe("assetUrl", () => {
  it("serves relative URLs from the base and keeps absolute ones", () => {
    expect(assetUrl("media/x.mp4", "/pausall/")).toBe("/pausall/media/x.mp4");
    expect(assetUrl("/media/x.mp4", "/pausall/")).toBe("/pausall/media/x.mp4");
    expect(assetUrl("https://host/x.mp4", "/pausall/")).toBe("https://host/x.mp4");
  });
});
