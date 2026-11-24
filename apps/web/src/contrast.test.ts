import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");
const [light, dark] = css.split(":root.dark {");

const tokens = (block: string) => Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6});/g)].map((m) => [m[1]!, m[2]!]));

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
};

const PAIRS = [
  ["foreground", "background"],
  ["foreground", "card"],
  ["foreground", "muted"],
  ["muted-foreground", "background"],
  ["muted-foreground", "card"],
  ["muted-foreground", "muted"],
  ["accent", "background"],
  ["accent", "card"],
  ["accent-foreground", "accent"],
] as const;

describe("Soft Calm text contrast is at least 4.5:1", () => {
  for (const [mode, block] of [["light", light!], ["dark", dark!]] as const) {
    const t = tokens(block);
    for (const [fg, bg] of PAIRS) {
      it(`${mode}: ${fg} on ${bg}`, () => {
        expect(t[fg], fg).toBeDefined();
        expect(t[bg], bg).toBeDefined();
        expect(ratio(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
