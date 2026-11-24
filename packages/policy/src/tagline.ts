import type { Product } from "@pausall/bundle-schema";

const MAX_LENGTH = 120;
/** A tagline word starting with one of these stems (safer, cures, bestselling) is a claim. */
const CLAIM_STEMS = ["best", "cheap", "health", "safe", "guarantee", "proven", "cure", "organic", "free"];
const CLAIM_PHRASES = ["number one"];
const NUMBER = /[$€£]?\d+(?:[.,]\d+)*%?/g;
const words = (s: string): string[] => s.toLowerCase().match(/[a-z]+/g) ?? [];

/**
 * Deterministic claim check: every number, currency or percent token and every claim word (a word starting with a claim stem) in the tagline
 * must appear in the product name, description or key features. The pipeline `taglineCheck` is advisory; this decides.
 */
export function checkTagline(tagline: string, product: Product): boolean {
  if (tagline.trim() === "" || tagline.length > MAX_LENGTH) return false;
  const source = [product.name, product.description, ...product.keyFeatures].join(" ").toLowerCase();
  const sourceWords = new Set(words(source));
  const sourceNumbers = new Set(source.match(NUMBER) ?? []);
  const t = tagline.toLowerCase();
  const sourcePhrase = ` ${words(source).join(" ")} `;
  const taglinePhrase = ` ${words(t).join(" ")} `;
  return (
    (t.match(NUMBER) ?? []).every((n) => sourceNumbers.has(n)) &&
    words(t).every((w) => !CLAIM_STEMS.some((s) => w.startsWith(s)) || sourceWords.has(w)) &&
    CLAIM_PHRASES.every((p) => !taglinePhrase.includes(` ${p} `) || sourcePhrase.includes(` ${p} `))
  );
}

/** The tagline if it passes `checkTagline`, otherwise the product name alone. */
export const taglineOrName = (tagline: string | undefined, product: Product): string =>
  tagline !== undefined && checkTagline(tagline, product) ? tagline : product.name;
