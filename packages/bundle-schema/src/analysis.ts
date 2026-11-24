import { array, at, bool, clipId, cosine, done, fail, integer, literal, nonEmptyString, num, object, oneOf, prob, type Int, type Issue, type Rec, type Result } from "./check.ts";
import { CATEGORIES, type Category } from "./config.ts";
import { checkSceneTimes, checkTimeline } from "./timeline.ts";

export const VERDICTS = ["safe", "caution", "unsafe"] as const;
export type Verdict = (typeof VERDICTS)[number];
export const SCENE_STATUSES = ["ok", "pending", "error"] as const;
export type SceneStatus = (typeof SCENE_STATUSES)[number];
export const SENTIMENT_LEVELS = [1, 2, 3, 4, 5] as const;
export type SentimentLevel = (typeof SENTIMENT_LEVELS)[number];
export const TAGLINE_CHECKS = ["pass", "fail"] as const;
export type TaglineCheck = (typeof TAGLINE_CHECKS)[number];

/** One judge's answer; a validated judgment always has `status: "ok"` (AD-15). */
export type Judgment = {
  status: "ok";
  verdict: Verdict;
  confidence: number;
  categories: Record<Category, { flagged: boolean; p: number }>;
};
export type Judgments = { jev: Judgment; qwen: Judgment };
export type SceneType = { primary: string; secondary?: string; freeLabel?: string };
export type Fit = { productId: string; jevFitP: number; embeddingSim: number; relevance: number };
/** Typed per-scene stage failure (AD-22). */
export type SceneError = { stage: string; message: string };

/**
 * Content fields are required when `status` is `ok`. A judgment defect does not fail the file:
 * the scene gets `invalid` reasons and `judgments: null`, and resolves to "analysis unavailable".
 */
export type AnalysisScene = {
  id: string;
  startMs: Int;
  endMs: Int;
  chunk: Int;
  status: SceneStatus;
  error?: SceneError;
  description?: string;
  sceneType?: SceneType;
  sentimentLevel?: SentimentLevel;
  fits?: Fit[];
  tagline?: string;
  taglineCheck?: TaglineCheck;
  judgments: Judgments | null;
  invalid: string[];
};

export type Analysis = {
  clipId: string;
  durationMs: Int;
  /** Pinned model names by role, never an alias such as `jev-latest` (AD-22). */
  models: Record<string, string>;
  scenes: AnalysisScene[];
};

function checkJudgments(v: unknown): string[] {
  const issues: Issue[] = [];
  if (object(v, "judgments", issues)) {
    for (const judge of ["jev", "qwen"] as const) {
      const p = at("judgments", judge);
      const j: unknown = v[judge];
      if (!object(j, p, issues)) continue;
      literal(j.status, "ok", at(p, "status"), issues);
      oneOf(j.verdict, VERDICTS, at(p, "verdict"), issues);
      prob(j.confidence, at(p, "confidence"), issues);
      if (!object(j.categories, at(p, "categories"), issues)) continue;
      for (const c of CATEGORIES) {
        const cp = at(at(p, "categories"), c);
        const cat = j.categories[c];
        if (!object(cat, cp, issues)) continue;
        bool(cat.flagged, at(cp, "flagged"), issues);
        prob(cat.p, at(cp, "p"), issues);
      }
    }
  }
  return issues.map((i) => `${i.path}: ${i.message}`);
}

function checkContent(s: Rec, p: string, sceneTypes: readonly string[], issues: Issue[]): void {
  const required = s.status === "ok";
  const has = (k: string) => required || s[k] !== undefined;
  if (s.status !== "error") {
    if (s.error !== undefined) fail(issues, at(p, "error"), "is allowed only when status is error");
  } else if (object(s.error, at(p, "error"), issues)) {
    nonEmptyString(s.error.stage, at(p, "error.stage"), issues);
    nonEmptyString(s.error.message, at(p, "error.message"), issues);
  }
  if (has("description")) nonEmptyString(s.description, at(p, "description"), issues);
  if (has("sceneType") && object(s.sceneType, at(p, "sceneType"), issues)) {
    const t = s.sceneType;
    oneOf(t.primary, sceneTypes, at(p, "sceneType.primary"), issues);
    if (t.secondary !== undefined) oneOf(t.secondary, sceneTypes, at(p, "sceneType.secondary"), issues);
    if (t.freeLabel !== undefined) nonEmptyString(t.freeLabel, at(p, "sceneType.freeLabel"), issues);
  }
  if (has("sentimentLevel")) oneOf(s.sentimentLevel, SENTIMENT_LEVELS, at(p, "sentimentLevel"), issues);
  if (has("fits") && array(s.fits, at(p, "fits"), issues)) {
    s.fits.forEach((f, i) => {
      const fp = at(at(p, "fits"), i);
      if (!object(f, fp, issues)) return;
      nonEmptyString(f.productId, at(fp, "productId"), issues);
      prob(f.jevFitP, at(fp, "jevFitP"), issues);
      cosine(f.embeddingSim, at(fp, "embeddingSim"), issues);
      num(f.relevance, at(fp, "relevance"), issues, 0, 100); // raw score; policy rounds half up
    });
  }
  if (s.tagline !== undefined || s.taglineCheck !== undefined) {
    nonEmptyString(s.tagline, at(p, "tagline"), issues);
    oneOf(s.taglineCheck, TAGLINE_CHECKS, at(p, "taglineCheck"), issues);
  }
}

/** Validates parsed `analysis/<clip>.json`; scene types are checked against `sceneTypes` (the validated `config/scene-types.json`). */
export function validateAnalysis(json: unknown, sceneTypes: readonly string[]): Result<Analysis> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  clipId(json.clipId, "clipId", issues);
  const durationOk = integer(json.durationMs, "durationMs", issues, 1);
  if (object(json.models, "models", issues)) {
    if (Object.keys(json.models).length === 0) fail(issues, "models", "must name at least one model");
    for (const [k, v] of Object.entries(json.models)) {
      if (nonEmptyString(v, at("models", k), issues) && /latest$/i.test(v)) fail(issues, at("models", k), "must be a pinned name, not an alias");
    }
  }
  const scenes: AnalysisScene[] = [];
  if (array(json.scenes, "scenes", issues)) {
    let timesOk = durationOk;
    json.scenes.forEach((s, i) => {
      const p = at("scenes", i);
      if (!object(s, p, issues)) return void (timesOk = false);
      if (!checkSceneTimes(s, p, issues)) timesOk = false;
      integer(s.chunk, at(p, "chunk"), issues, 1);
      oneOf(s.status, SCENE_STATUSES, at(p, "status"), issues);
      checkContent(s, p, sceneTypes, issues);
      const invalid = checkJudgments(s.judgments);
      scenes.push({ ...s, invalid, judgments: invalid.length ? null : s.judgments } as AnalysisScene);
    });
    if (timesOk) issues.push(...checkTimeline(scenes, json.durationMs as number));
  }
  return done(issues, () => ({ ...json, scenes }) as Analysis);
}
