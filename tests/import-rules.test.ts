import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function lint(dir: string, source: string, name = "__import_rule_probe__.ts") {
  const file = join(root, dir, "src", name);
  writeFileSync(file, source);
  try {
    const res = spawnSync(join(root, "node_modules", ".bin", "oxlint"), [file], { cwd: root, encoding: "utf8" });
    return { status: res.status, output: res.stdout + res.stderr };
  } finally {
    rmSync(file, { force: true });
  }
}

describe("AD-23 import boundaries", () => {
  it.each([
    ["apps/web", 'import "@pausall/pipeline";\n', "@pausall/pipeline"],
    ["packages/pipeline", 'import "@pausall/web";\n', "@pausall/web"],
    ["packages/policy", 'import "node:fs";\n', "node:fs"],
    ["packages/policy", 'import "fs";\n', "fs"],
    ["packages/policy", 'import "@pausall/pipeline";\n', "@pausall/pipeline"],
    ["packages/policy", 'import "child_process";\n', "child_process"],
    ["packages/policy", 'import OpenAI from "openai";\n', "openai"],
    ["packages/policy", 'fetch("https://example.com");\n', "fetch"],
    ["packages/policy", "export const w = window;\n", "window"],
    ["packages/policy", "export const d = document;\n", "document"],
    ["packages/policy", 'globalThis.fetch("https://example.com");\n', "globalThis"],
    ["packages/policy", 'import "http";\n', "http"],
    ["apps/web", 'import "@pausall/pipeline/x";\n', "@pausall/pipeline/x"],
    ["apps/web", 'import "../../../packages/pipeline/src/index.ts";\n', "../../../packages/pipeline/src/index.ts"],
    ["packages/bundle-schema", 'import "@pausall/pipeline";\n', "@pausall/pipeline"],
    ["packages/bundle-schema", 'import "node:fs";\n', "node:fs"],
  ])("%s rejects %s", (dir, source, name) => {
    const { status, output } = lint(dir, source);
    expect(status).not.toBe(0);
    expect(output).toContain(`'${name}'`);
  });

  it.each([
    ["packages/policy", 'import "@pausall/bundle-schema";\n'],
    ["packages/policy", 'import "./rules/r1.ts";\n'],
    ["packages/policy", 'import "../x.ts";\n'],
    ["packages/policy", 'import "@pausall/bundle-schema/x";\n'],
    ["apps/web", 'import "@pausall/policy";\nimport "@pausall/bundle-schema";\n'],
  ])("%s allows %s", (dir, source) => {
    const { status, output } = lint(dir, source);
    expect(output).not.toContain("no-restricted");
    expect(status).toBe(0);
  });

  const testProbe = "__import_rule_probe__.test.ts";
  it.each([
    ['import "node:fs";\n', "node:fs"],
    ['import "@pausall/pipeline";\n', "@pausall/pipeline"],
    ['import "../../pipeline/src/index.ts";\n', "../../pipeline/src/index.ts"],
  ])("bundle-schema test files reject %s", (source, name) => {
    const { status, output } = lint("packages/bundle-schema", source, testProbe);
    expect(status).not.toBe(0);
    expect(output).toContain(`'${name}'`);
  });

  it("bundle-schema test files allow vitest", () => {
    const { status, output } = lint("packages/bundle-schema", 'import "vitest";\n', testProbe);
    expect(output).not.toContain("no-restricted");
    expect(status).toBe(0);
  });

  it.each([
    ['import "node:fs";\n', "node:fs"],
    ['import "@pausall/pipeline";\n', "@pausall/pipeline"],
    ['import "../../pipeline/src/index.ts";\n', "../../pipeline/src/index.ts"],
    ['import "./../../pipeline/src/index.ts";\n', "./../../pipeline/src/index.ts"],
  ])("policy test files reject %s", (source, name) => {
    const { status, output } = lint("packages/policy", source, testProbe);
    expect(status).not.toBe(0);
    expect(output).toContain(`'${name}'`);
  });

  it.each(['import "vitest";\n', 'import "@pausall/bundle-schema";\n'])("policy test files allow %s", (source) => {
    const { status, output } = lint("packages/policy", source, testProbe);
    expect(output).not.toContain("no-restricted");
    expect(status).toBe(0);
  });
});
