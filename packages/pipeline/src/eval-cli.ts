// Usage: pnpm eval [--check] [--root <dir>]   |   pnpm eval --compare-judges
// Sweeps every labeled clip through resolvePause and writes docs/eval/report.md; exits 1 when the guardrail fails.
// --check (CI) writes nothing and also fails when the committed report is out of date.
// --compare-judges calls models (keys in .env), writes docs/eval/judges.md only, and is never run in CI.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { validateAnalysis, validateDecisions, validateEvalConfig, validateLabels, validateSceneTypes, type Result } from "@pausal/bundle-schema";
import { evaluate, report, type EvalClip } from "./eval.ts";

const rootArg = process.argv.indexOf("--root");
const root = rootArg === -1 ? resolve(import.meta.dirname, "../../..") : resolve(process.argv[rootArg + 1] ?? ".");
const check = process.argv.includes("--check");

const load = <T>(file: string, validate: (j: unknown) => Result<T>): T => {
  const r = validate(JSON.parse(readFileSync(join(root, file), "utf8")));
  if (!r.ok) throw new Error(`${file}: ${r.issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`);
  return r.value;
};
const optional = <T>(file: string, validate: (j: unknown) => Result<T>): T | null => (existsSync(join(root, file)) ? load(file, validate) : null);

const sceneTypes = load("config/scene-types.json", validateSceneTypes);
const labelFiles = existsSync(join(root, "data/labels")) ? readdirSync(join(root, "data/labels")).filter((f) => f.endsWith(".json")).sort() : [];
const clips: EvalClip[] = labelFiles.map((f) => {
  const labels = load(`data/labels/${f}`, validateLabels);
  if (`${labels.clipId}.json` !== f) throw new Error(`data/labels/${f}: clipId must match the file name, is "${labels.clipId}"`);
  return {
    clipId: labels.clipId,
    labels,
    decisions: optional(`data/decisions/${f}`, validateDecisions),
    analysis: optional(`data/analysis/${f}`, (j) => validateAnalysis(j, sceneTypes)),
  };
});

if (process.argv.includes("--compare-judges")) {
  const { compareJudges } = await import("./compare-judges.ts");
  await compareJudges(root, clips);
} else {
  const result = evaluate(clips, load("config/eval.json", validateEvalConfig));
  const text = report(result);
  const out = join(root, "docs/eval/report.md");
  const problems = [...result.guardrail.problems];
  if (check) {
    const committed = existsSync(out) ? readFileSync(out, "utf8") : null;
    if (committed !== text) problems.push(`docs/eval/report.md ${committed === null ? "is missing" : "is out of date"}; run pnpm eval`);
  } else {
    mkdirSync(join(root, "docs/eval"), { recursive: true });
    writeFileSync(out, text);
  }
  if (problems.length) {
    console.error(`eval${check ? " --check" : ""} failed.\n${problems.join("\n")}`);
    process.exit(1);
  }
  console.log(`eval: guardrail pass on ${result.clips.length} clip(s), ${result.joinedUnsafeSamples} unsafe pause times, ${result.failures.length} listed failure(s).${check ? "" : " Wrote docs/eval/report.md."}`);
}
