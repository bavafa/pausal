import type { Sentiment, SentimentLevel } from "@pausall/bundle-schema";

/** Sentiment level 1 to 5 to its sentiment value and mood label. */
export const SENTIMENT_TABLE: Readonly<Record<SentimentLevel, { sentiment: Sentiment; moodLabel: string }>> = {
  1: { sentiment: -1, moodLabel: "Tense" },
  2: { sentiment: -0.5, moodLabel: "Somber" },
  3: { sentiment: 0, moodLabel: "Neutral" },
  4: { sentiment: 0.5, moodLabel: "Relaxed" },
  5: { sentiment: 1, moodLabel: "Joyful" },
};
