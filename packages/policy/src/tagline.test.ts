import { describe, expect, it } from "vitest";
import type { Product } from "@pausal/bundle-schema";
import { checkTagline, taglineOrName } from "./index.ts";

const product: Product = {
  id: "B000P1",
  name: "Calm Pan 28 cm",
  imagePath: "img/B000P1.jpg",
  description: "A nonstick pan, PFOA-free, 20% lighter than cast iron.",
  keyFeatures: ["Oven safe to 200 C"],
  attribution: "abo",
};

describe("checkTagline", () => {
  it.each([
    "A light pan for slow mornings.",
    "Nonstick, 20% lighter, 28 cm.",
    "PFOA-free and oven safe.",
  ])("passes %s", (t) => expect(checkTagline(t, product)).toBe(true));

  it.each([
    "The best pan you will own.",
    "Now 30% lighter.",
    "Only $19 today.",
    "Guaranteed to last.",
    "The number one pan.",
    "Organic and healthy.",
    "A safer pan.",
    "The healthier choice.",
    "We guarantee it.",
    "Guaranteed to last.",
    "Cures sticky eggs.",
    "A bestselling pan.",
    "x".repeat(121),
    " ",
  ])("rejects %s", (t) => expect(checkTagline(t, product)).toBe(false));

  it("falls back to the product name", () => {
    expect(taglineOrName("The cheapest pan.", product)).toBe("Calm Pan 28 cm");
    expect(taglineOrName(undefined, product)).toBe("Calm Pan 28 cm");
    expect(taglineOrName("A light pan.", product)).toBe("A light pan.");
  });
});
