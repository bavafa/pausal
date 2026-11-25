import type { SimulatedPrice, SimulatedSplit } from "@pausal/bundle-schema";
import { splitPrice, ZERO_EARNING } from "@pausal/policy";
import type { PauseEntry } from "./session.ts";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Only simulated values are formatted (AD-8); there is no path for a bare number. */
export const dollars = (v: SimulatedPrice) => USD.format(v.cents / 100);
const splitText = (s: SimulatedSplit) => `platform ${USD.format(s.platformCents / 100)}, publisher ${USD.format(s.publisherCents / 100)}`;

/**
 * Cost per click: an ad shown costs nothing; the advertiser pays its relevance-weighted bid when the viewer presses
 * View product (on a TV, scanning the QR code). A second click on the same product in one visit is not charged again.
 */
function charges(log: readonly PauseEntry[]): (SimulatedPrice | null)[] {
  const paid = new Set<string>();
  return log.map((e) => {
    if (e.view.kind !== "ad" || !e.click || paid.has(e.click.productId)) return null;
    paid.add(e.click.productId);
    return e.view.price;
  });
}

/** The one line below the player: earnings come from clicks; ads shown and held back are counted next to them. */
export function tallyLine(log: readonly PauseEntry[]): string {
  if (log.length === 0) return "Simulated earnings: no pauses yet";
  const paid = charges(log).filter((c): c is SimulatedPrice => c !== null);
  const total: SimulatedPrice = { cents: paid.reduce((sum, c) => sum + c.cents, 0) as SimulatedPrice["cents"], simulated: true };
  const shown = log.filter((e) => e.view.kind === "ad").length;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return `Simulated earnings: ${dollars(total)} from ${plural(paid.length, "click", "clicks")} · ${plural(shown, "ad", "ads")} shown, ${log.length - shown} held back`;
}

export type EarningsRow = { time: string; clip: string | null; what: string; figures: string };

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** One row per pause event; a row from another clip names that clip. */
export function earningsRows(log: readonly PauseEntry[], currentClipId: string, titleOf: (clipId: string) => string): EarningsRow[] {
  const paid = charges(log);
  return log.map((e, i) => {
    const price = paid[i];
    const figures =
      e.view.kind !== "ad" ? `Simulated ${dollars(ZERO_EARNING)}`
      : price ? `Clicked: simulated ${dollars(price)} (${splitText(splitPrice(price))})`
      : e.click ? `Clicked again: not charged`
      : `Shown, no click: ${dollars(ZERO_EARNING)}`;
    return { time: clock(e.tMs), clip: e.clipId === currentClipId ? null : titleOf(e.clipId), what: e.view.kind === "ad" ? `Ad: ${e.view.product.name}` : e.view.text, figures };
  });
}
