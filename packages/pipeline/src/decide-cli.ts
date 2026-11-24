// Usage: pnpm decide [--check] [--root <dir>]. Writes data/decisions/<clip-id>.json, or with --check fails on any difference.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  validateAnalysis,
  validateCampaigns,
  validateDecisions,
  validateManifest,
  validateProduct,
  validateSceneTypes,
  validateThresholds,
  type Decisions,
  type Product,
  type Result,
} from "@pausall/bundle-schema";
import { canonicalJson, deriveDecisions, productIssues } from "./decide.ts";

const rootArg = process.argv.indexOf("--root");
const root = rootArg === -1 ? resolve(import.meta.dirname, "../../..") : resolve(process.argv[rootArg + 1] ?? ".");
const check = process.argv.includes("--check");
const errors: string[] = [];

const listJson = (dir: string): string[] =>
  (existsSync(join(root, dir)) ? readdirSync(join(root, dir)) : [])
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => `${dir}/${f}`);

/** Reads, parses and validates one file; failures are collected with the file name. */
function load<T>(file: string, validate: (json: unknown) => Result<T>): { value: T; hash: string } | undefined {
  let bytes: Buffer;
  let json: unknown;
  try {
    bytes = readFileSync(join(root, file));
    json = JSON.parse(bytes.toString("utf8"));
  } catch (e) {
    errors.push(`${file}: ${e instanceof Error ? e.message : String(e)}`);
    return undefined;
  }
  const r = validate(json);
  if (!r.ok) {
    errors.push(...r.issues.map((i) => `${file}: ${i.path}: ${i.message}`));
    return undefined;
  }
  return { value: r.value, hash: createHash("sha256").update(bytes).digest("hex") };
}

function exitOnErrors(): void {
  if (errors.length === 0) return;
  console.error(`${check ? "decide --check failed." : "decide: nothing written."}\n${errors.join("\n")}`);
  process.exit(1);
}

const sceneTypes = load("config/scene-types.json", validateSceneTypes);
const thresholds = load("config/thresholds.json", validateThresholds);
const campaigns = load("config/campaigns.json", validateCampaigns);

const products = new Map<string, Product>();
for (const file of listJson("data/products")) {
  const p = load(file, validateProduct);
  if (!p) continue;
  if (`${p.value.id}.json` !== basename(file)) errors.push(`${file}: id: must match the file name, is "${p.value.id}"`);
  products.set(p.value.id, p.value);
}

const analyses = sceneTypes ? listJson("data/analysis").map((file) => ({ file, a: load(file, (j) => validateAnalysis(j, sceneTypes.value)) })) : [];
for (const { file, a } of analyses) {
  if (!a) continue;
  const id = basename(file, ".json");
  if (a.value.clipId !== id) errors.push(`${file}: clipId: must match the file name, is "${a.value.clipId}"`);
  const manifestFile = `data/manifest/${id}.json`;
  const m = load(manifestFile, validateManifest);
  if (m && m.value.clipId !== id) errors.push(`${manifestFile}: clipId: must match the file name, is "${m.value.clipId}"`);
  if (m && m.value.durationMs !== a.value.durationMs) {
    errors.push(`${manifestFile}: durationMs: must equal analysis durationMs ${a.value.durationMs}, is ${m.value.durationMs}`);
  }
}
exitOnErrors();
if (!thresholds || !campaigns) throw new Error("unreachable: config failed without an error");

const derived: { file: string; decisions: Decisions; text: string }[] = [];
for (const { a } of analyses) {
  if (!a) continue;
  const decisions = deriveDecisions(a.value, thresholds.value, campaigns.value, products, {
    analysisHash: a.hash,
    thresholdsHash: thresholds.hash,
    campaignsHash: campaigns.hash,
  });
  const file = `data/decisions/${a.value.clipId}.json`;
  const r = validateDecisions(decisions);
  if (!r.ok) errors.push(...r.issues.map((i) => `${file} (derived): ${i.path}: ${i.message}`));
  derived.push({ file, decisions, text: canonicalJson(decisions) });
}
const expected = new Set(derived.map((d) => d.file));
for (const file of listJson("data/decisions")) if (!expected.has(file)) errors.push(`${file}: has no analysis file; delete it or add its analysis`);
errors.push(...productIssues(derived.map((d) => d.decisions), [...products.keys()]).map((i) => `data/products: ${i.path}: ${i.message}`));
exitOnErrors();

if (check) {
  for (const { file, text } of derived) {
    let committed: string | undefined;
    try {
      committed = readFileSync(join(root, file), "utf8");
    } catch {
      committed = undefined;
    }
    if (committed !== text) errors.push(`${file}: ${committed === undefined ? "is missing" : "differs from the derived output"}; run pnpm decide`);
  }
  if (errors.length) {
    console.error(`decide --check failed.\n${errors.join("\n")}`);
    process.exit(1);
  }
  console.log(`decide --check: ${derived.length} decisions file(s) up to date.`);
} else {
  mkdirSync(join(root, "data/decisions"), { recursive: true });
  for (const { file, text } of derived) writeFileSync(join(root, file), text);
  console.log(`decide: wrote ${derived.map((d) => d.file).join(", ") || "nothing"}.`);
}
