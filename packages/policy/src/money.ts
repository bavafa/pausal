import type { Int, SimulatedPrice, SimulatedSplit, Thresholds } from "@pausall/bundle-schema";

const PUBLISHER_PERCENT = 30;

/** Rounds half up to an integer: 59.5 gives 60. Float noise is snapped first so 15.499999999999998 counts as 15.5. */
export const roundHalfUp = (x: number): Int => Math.floor(Number(x.toFixed(9)) + 0.5) as Int;

/** `round_half_up(bidCents * ((1 - w) + w * relevance / 100))`, with the rounded relevance; rises with bid and relevance. */
export function priceFor(bidCents: Int, relevance: Int, thresholds: Thresholds): SimulatedPrice {
  const w = thresholds.pricing.relevanceWeight;
  return { cents: roundHalfUp(bidCents * (1 - w + (w * relevance) / 100)), simulated: true };
}

/** Publisher gets 30 percent rounded down, the platform the remainder (AD-8). */
export function splitPrice(price: SimulatedPrice): SimulatedSplit {
  const publisherCents = Math.floor((price.cents * PUBLISHER_PERCENT) / 100) as Int;
  return { platformCents: (price.cents - publisherCents) as Int, publisherCents, simulated: true };
}

/** What a pause without an ad earns. */
export const ZERO_EARNING: Readonly<SimulatedPrice> = Object.freeze({ cents: 0 as Int, simulated: true });
