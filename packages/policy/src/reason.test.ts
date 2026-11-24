import { describe, expect, it } from "vitest";
import { reasonLine } from "./reason.ts";

describe("reasonLine", () => {
  it.each([
    ["kitchen", ["Flat base", "28 cm", "Oven use"], "Fits a kitchen scene: Flat base, 28 cm."],
    ["office", [], "Fits an office scene."],
    [undefined, ["Warm light"], "Fits this scene: Warm light."],
    [undefined, [], "Fits this scene."],
  ] as const)("%s %j", (label, features, line) => expect(reasonLine(label, features)).toBe(line));
});
