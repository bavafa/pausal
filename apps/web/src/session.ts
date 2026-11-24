import type { SimulatedClick } from "@pausal/bundle-schema";
import type { PauseView } from "./pause-view.ts";

/** One real pause event that opened the pause view; the session log resets on reload (AD-23). */
export type PauseEntry = { clipId: string; tMs: number; view: PauseView; click: SimulatedClick | null };

/** Sets the click on the latest pause, the one whose ad card was used. */
export const withClick = (log: readonly PauseEntry[], click: SimulatedClick): PauseEntry[] =>
  log.length === 0 ? [...log] : [...log.slice(0, -1), { ...log.at(-1)!, click }];
