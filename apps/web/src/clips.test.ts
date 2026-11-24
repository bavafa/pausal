import { describe, expect, it, vi } from "vitest";
import { loadClips } from "./clips.ts";
import { parseRoute } from "./route.ts";

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
  });
});
