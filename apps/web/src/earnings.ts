import type { SimulatedPrice, SimulatedSplit } from "@pausall/bundle-schema";
import { splitPrice, ZERO_EARNING } from "@pausall/policy";
import type { PauseEntry } from "./session.ts";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Only simulated values are formatted (AD-8); there is no path for a bare number. */
export const dollars = (v: SimulatedPrice) => USD.format(v.cents / 100);
const splitText = (s: SimulatedSplit) => `platform ${USD.format(s.platformCents / 100)}, publisher ${USD.format(s.publisherCents / 100)}`;

const earned = (e: PauseEntry): { price: SimulatedPrice; split: SimulatedSplit } =>
  e.view.kind === "ad" ? { price: e.view.price, split: e.view.split } : { price: ZERO_EARNING, split: splitPrice(ZERO_EARNING) };

/** The one line below the player; the held-back zero sits next to its count. */
export function tallyLine(log: readonly PauseEntry[]): string {
  if (log.length === 0) return "Simulated earnings: no pauses yet";
  const shown = log.filter((e) => e.view.kind === "ad");
  const total: SimulatedPrice = { cents: shown.reduce((sum, e) => sum + earned(e).price.cents, 0) as SimulatedPrice["cents"], simulated: true };
  const held = log.length - shown.length;
  return `Simulated earnings: ${shown.length} ${shown.length === 1 ? "ad" : "ads"} shown (${dollars(total)}), ${held} held back (${dollars(ZERO_EARNING)})`;
}

export type EarningsRow = { time: string; clip: string | null; what: string; figures: string };

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** One row per pause event; a row from another clip names that clip. */
export function earningsRows(log: readonly PauseEntry[], currentClipId: string, titleOf: (clipId: string) => string): EarningsRow[] {
  return log.map((e) => {
    const { price, split } = earned(e);
    return {
      time: clock(e.tMs),
      clip: e.clipId === currentClipId ? null : titleOf(e.clipId),
      what: e.view.kind === "ad" ? `Ad: ${e.view.product.name}` : e.view.text,
      figures: `Simulated ${dollars(price)} (${splitText(split)})`,
    };
  });
}
