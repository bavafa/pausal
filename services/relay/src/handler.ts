// Upload relay (docs/upload-plan.md): holds the model keys, analyzes one chunk of an uploaded video, returns decisions.
// Privacy (FR-19): frames, audio, transcripts and descriptions stay in memory for the request; nothing from the body is logged.
import { createHash } from "node:crypto";
import { validateSceneTypes, validateThresholds } from "@pausal/bundle-schema";
import { withoutPlaceholders, type CatalogItem } from "@pausal/pipeline/catalog.ts";
import { analyzeChunk, checkChunk, type ChunkRequest } from "@pausal/pipeline/chunk.ts";
import { CostCapError, Ledger } from "@pausal/pipeline/call.ts";
import { Jev, Qwen } from "@pausal/pipeline/clients.ts";
import type { PipelineConfig } from "@pausal/pipeline/config.ts";
import { makeModels } from "@pausal/pipeline/models.ts";
import { r2Get, r2Put, readR2Keys } from "@pausal/pipeline/r2.ts";
import pipelineJson from "../../../config/pipeline.json" with { type: "json" };
import thresholdsJson from "../../../config/thresholds.json" with { type: "json" };
import sceneTypesJson from "../../../config/scene-types.json" with { type: "json" };

const ORIGINS = new Set(["https://bavafa.github.io", "http://localhost:5173", "http://localhost:4173"]);
const cfg = pipelineJson as PipelineConfig;
const thresholds = must(validateThresholds(thresholdsJson), "config/thresholds.json");
const sceneTypes = must(validateSceneTypes(sceneTypesJson), "config/scene-types.json");

function must<T>(r: { ok: true; value: T } | { ok: false; issues: unknown[] }, name: string): T {
  if (!r.ok) throw new Error(`${name} is invalid`);
  return r.value;
}

const env = (k: string, fallback?: string): string => {
  const v = process.env[k] ?? fallback;
  if (v === undefined || v === "") throw new Error(`${k} is not set`);
  return v;
};

/** Catalog slice and vectors from R2, loaded once per warm instance. */
let catalogPromise: Promise<{ items: CatalogItem[]; vectors: Float32Array; dims: number; shortNames: Map<string, string> }> | null = null;
function catalog(base: string) {
  catalogPromise ??= (async () => {
    const get = async (p: string) => {
      const r = await fetch(`${base}/catalog/${p}`);
      if (!r.ok) throw new Error(`catalog/${p}: ${r.status}`);
      return r;
    };
    // Short names are optional: without the file, upload results show the full listing name.
    const names = fetch(`${base}/catalog/short-names.json`).then((r) => (r.ok ? (r.json() as Promise<Record<string, string>>) : {})).catch(() => ({}));
    const [items, meta, buf, short] = await Promise.all([get("slice.json").then((r) => r.json()), get("index.json").then((r) => r.json()), get("index.f32").then((r) => r.arrayBuffer()), names]);
    const m = meta as { model: string; dimensions: number; ids: string[] };
    const vectors = new Float32Array(buf);
    if (m.model !== cfg.models.embedding || vectors.length !== (items as unknown[]).length * m.dimensions) throw new Error("catalog index does not match the pipeline config");
    return { ...withoutPlaceholders({ items: items as CatalogItem[], vectors, dims: m.dimensions }), shortNames: new Map(Object.entries(short as Record<string, string>)) };
  })().catch((e) => {
    catalogPromise = null;
    throw e;
  });
  return catalogPromise;
}

type Usage = { spentUsd: number; uploads: Record<string, string[]> };

const json = (status: number, body: unknown, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(origin) } });
const cors = (origin: string | null): Record<string, string> =>
  origin && ORIGINS.has(origin) ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "origin" } : {};

export async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return json(405, { error: "Use POST." }, origin);
  if (!origin || !ORIGINS.has(origin)) return json(403, { error: "This relay only serves the Pausal site." }, origin);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "The request was not valid JSON." }, origin);
  }
  const problem = checkChunk(body);
  if (problem) return json(400, { error: problem }, origin);
  const chunk = body as ChunkRequest;

  const r2 = readR2Keys();
  const capUsd = Number(env("RELAY_DAILY_CAP_USD", "2"));
  const perVisitor = Number(env("RELAY_UPLOADS_PER_DAY", "3"));
  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0]?.trim() ?? "local";
  const visitor = createHash("sha256").update(`${env("RELAY_SALT")}:${ip}`).digest("hex").slice(0, 16);
  const usageKey = `usage/${new Date().toISOString().slice(0, 10)}.json`;
  // shortcut: read-modify-write on one R2 object per day, so two chunks finishing at the same moment can undercount spend by one chunk (cents); move to a store with atomic increments if the cap is ever hit in practice.
  const read = async (): Promise<Usage> => JSON.parse((await r2Get(r2, usageKey))?.toString("utf8") ?? '{"spentUsd":0,"uploads":{}}') as Usage;
  const usage = await read();
  if (usage.spentUsd >= capUsd) return json(503, { error: "Uploads are closed for today. Please try again tomorrow." }, origin);
  const mine = usage.uploads[visitor] ?? [];
  if (!mine.includes(chunk.uploadId) && mine.length >= perVisitor) return json(429, { error: `You have used your ${perVisitor} uploads for today. Please try again tomorrow.` }, origin);

  const ledger = new Ledger(capUsd - usage.spentUsd);
  const clientCfg = { retry: { timeoutMs: cfg.timeoutMs, retries: cfg.retries }, prices: cfg.pricesUsdPerMillionTokens, ledger };
  const qwen = new Qwen(env("DASHSCOPE_BASE_URL"), env("DASHSCOPE_API_KEY"), clientCfg);
  const jev = new Jev(env("TYPESAFE_API_KEY"), cfg.models.jev, clientCfg);
  let result;
  try {
    const cat = await catalog(r2.publicUrl);
    result = await analyzeChunk(chunk, {
      models: makeModels(qwen, jev, cfg, sceneTypes, r2.publicUrl),
      catalog: cat,
      shortNames: cat.shortNames,
      opts: { ...cfg, thresholds, modelNames: cfg.models },
      thresholds,
      transcribeWav: (data) => qwen.chat(cfg.models.speech, [{ role: "user", content: [{ type: "input_audio", input_audio: { data } }] }], "transcribe", false, true),
      imageBase: r2.publicUrl,
    });
  } catch (e) {
    if (e instanceof CostCapError) return json(503, { error: "Uploads are closed for today. Please try again tomorrow." }, origin);
    console.error(`chunk failed: ${e instanceof Error ? e.message : "unknown error"}`);
    return json(502, { error: "The analysis failed for this part of the video." }, origin);
  } finally {
    const latest = await read().catch(() => usage);
    latest.spentUsd = Number((latest.spentUsd + ledger.totalUsd).toFixed(6));
    const list = latest.uploads[visitor] ?? [];
    if (!list.includes(chunk.uploadId)) latest.uploads[visitor] = [...list, chunk.uploadId];
    await r2Put(r2, usageKey, new Uint8Array(Buffer.from(JSON.stringify(latest))), "application/json", "no-store").catch(() => {});
  }
  return json(200, result, origin);
}
