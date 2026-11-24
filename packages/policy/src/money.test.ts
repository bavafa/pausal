import { describe, expect, it } from "vitest";
import type { Int, Thresholds } from "@pausall/bundle-schema";
import { clickFor, priceFor, splitPrice, ZERO_EARNING } from "./index.ts";

const at = (w: number) => ({ pricing: { relevanceWeight: w } }) as Thresholds;
const t = at(0.5);
const cents = (bid: number, rel: number, th = t) => priceFor(bid as Int, rel as Int, th).cents;

describe("money", () => {
  it("price is simulated and follows the formula", () => {
    expect(priceFor(200 as Int, 60 as Int, t)).toEqual({ cents: 160, simulated: true });
    expect(cents(100, 100)).toBe(100);
  });

  it("an exact half rounds up despite float error (w 0.3, bid 20, relevance 25)", () => {
    expect(cents(20, 25, at(0.3))).toBe(16);
  });

  it("w 0 prices at the bid and w 1 with relevance 0 prices at zero", () => {
    expect(cents(137, 60, at(0))).toBe(137);
    expect(cents(137, 0, at(1))).toBe(0);
  });

  it("price is monotonic in bid and relevance", () => {
    for (let rel = 60; rel <= 100; rel += 5) {
      for (let bid = 0; bid < 500; bid += 7) {
        expect(cents(bid + 7, rel)).toBeGreaterThanOrEqual(cents(bid, rel));
        expect(cents(bid, rel + 5)).toBeGreaterThanOrEqual(cents(bid, rel));
      }
    }
    expect(cents(300, 90)).toBeGreaterThan(cents(300, 60));
  });

  it.each([
    [100, 70, 30],
    [87, 61, 26],
    [1, 1, 0],
    [0, 0, 0],
    [9, 7, 2],
  ])("splits %i into platform %i and publisher %i (publisher rounded down)", (c, platformCents, publisherCents) => {
    expect(splitPrice({ cents: c as Int, simulated: true })).toEqual({ platformCents, publisherCents, simulated: true });
  });

  it("zero earning is simulated and frozen", () => {
    expect(ZERO_EARNING).toEqual({ cents: 0, simulated: true });
    expect(Object.isFrozen(ZERO_EARNING)).toBe(true);
  });

  it("marks a click as simulated", () => {
    expect(clickFor("p1")).toEqual({ productId: "p1", simulated: true });
  });
});
