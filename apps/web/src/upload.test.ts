import { describe, expect, it } from "vitest";
import type { Manifest } from "@pausal/bundle-schema";
import decisionsJson from "../../../data/decisions/000000000001.json" with { type: "json" };
import { checkFile, mergeChunks, placeChunk } from "./upload.ts";

const clip = { clipId: "000000000001", title: "Mine", videoUrl: "blob:x", durationMs: 70_000, aiGenerated: false, hasDialogue: true, attributionKey: "upload" } as Manifest;

describe("checkFile", () => {
  it("accepts MP4, MOV and WebM up to 100 MB and 3 minutes", () => {
    expect(checkFile({ type: "video/mp4", size: 1000 }, 180_000)).toBeNull();
    expect(checkFile({ type: "video/x-msvideo", size: 1000 })).toMatch(/MP4, MOV or WebM/);
    expect(checkFile({ type: "video/webm", size: 101 * 1024 * 1024 })).toMatch(/100 MB/);
    expect(checkFile({ type: "video/quicktime", size: 1000 }, 180_001)).toMatch(/3 minutes/);
    expect(checkFile({ type: "video/mp4", size: 1000 }, Number.NaN)).toMatch(/could not open/);
  });
});

describe("placeChunk and mergeChunks", () => {
  const answer = { decisions: decisionsJson, products: [{ id: "x" }] };
  it("validates a relay answer and moves it to clip time", () => {
    const { decisions, products } = placeChunk(answer, "000000000001", 35_000, 70_000);
    expect(products).toEqual([]); // the invalid product is dropped
    expect([decisions.scenes[0]?.id, decisions.scenes[0]?.startMs, decisions.scenes.at(-1)?.endMs]).toEqual(["s0035000", 35_000, 70_000]);
  });
  it("rejects an answer for another clip or another length", () => {
    expect(() => placeChunk(answer, "abcdefabcdef", 0, 35_000)).toThrow(/does not match/);
    expect(() => placeChunk(answer, "000000000001", 0, 20_000)).toThrow(/does not match/);
    expect(() => placeChunk({ decisions: { ...decisionsJson, scenes: [] } }, "000000000001", 0, 35_000)).toThrow(/does not match/);
  });
  it("merges chunks in time order, whatever order they arrived in", () => {
    const late = placeChunk(answer, "000000000001", 35_000, 70_000).decisions;
    const early = placeChunk(answer, "000000000001", 0, 35_000).decisions;
    const m = mergeChunks(clip, [late, early]);
    expect([m?.durationMs, m?.scenes[0]?.startMs, m?.scenes.at(-1)?.endMs, m?.scenes.length]).toEqual([70_000, 0, 70_000, 2 * decisionsJson.scenes.length]);
    expect(mergeChunks(clip, [])).toBeNull();
  });
});
