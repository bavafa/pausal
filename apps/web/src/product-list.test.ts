import { describe, expect, it } from "vitest";
import type { Int } from "@pausal/bundle-schema";
import { rankAt, sceneAt } from "@pausal/policy";
import { CLIPS, loadDecisions, PRODUCTS } from "./clips.ts";
import { productList } from "./product-list.ts";

const decisions = loadDecisions(CLIPS.find((c) => c.clipId === "000000000001")!)!;
const at = (tMs: number) => {
  const { scene, ranked } = rankAt(decisions, tMs, null);
  return productList(scene, ranked, PRODUCTS);
};

describe("productList on the fixture", () => {
  it("shows the top product with reason and relevance, and the rest small", () => {
    const v = at(2500)!;
    expect([v.top.product.name, v.top.reason, v.top.relevance]).toEqual(["Everyday Skillet", "Fits a kitchen scene: 28 cm, Flat base.", 80]);
    expect(v.rest.map((i) => [i.label, i.bid?.cents ?? null])).toEqual([["Kettle", 80]]);
    expect(v.top.label).toBe("Skillet");
  });
  it("still shows the list in a sensitive scene", () => expect(at(7500)?.top.product.name).toBe("Everyday Skillet"));
  it("shows no list where analysis is unavailable or outside the clip", () => {
    expect(at(22500)).toBeNull();
    expect(at(decisions.durationMs)).toBeNull();
  });
  it("skips an unknown product ID", () => {
    const scene = sceneAt(decisions, 2500)!;
    const v = productList(scene, [{ productId: "nope", relevance: 99 as Int, reason: "x", bid: null }, ...scene.ranked], PRODUCTS)!;
    expect(v.top.product.id).toBe("fixture-pan");
  });
  it("puts a held product first", () => {
    const { scene, ranked } = rankAt(decisions, 2500, { sceneId: "s0000000", productId: "fixture-kettle", sinceMs: 2000 });
    // within holdMs, same outcome and safe tag: rankAt keeps the held product first
    expect(productList(scene, ranked, PRODUCTS)?.top.product.id).toBe("fixture-kettle");
  });
});
