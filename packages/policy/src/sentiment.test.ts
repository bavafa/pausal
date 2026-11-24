import { expect, it } from "vitest";
import { SENTIMENT_LEVELS, SENTIMENTS } from "@pausall/bundle-schema";
import { SENTIMENT_TABLE } from "./index.ts";

it("maps levels 1 to 5 to sentiments and mood labels", () => {
  expect(SENTIMENT_LEVELS.map((l) => SENTIMENT_TABLE[l].sentiment)).toEqual([...SENTIMENTS]);
  expect(SENTIMENT_LEVELS.map((l) => SENTIMENT_TABLE[l].moodLabel)).toEqual(["Tense", "Somber", "Neutral", "Relaxed", "Joyful"]);
});
