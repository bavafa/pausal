import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Prices } from "./clients.ts";

/** `config/pipeline.json`: pinned model names by role, prices, cost cap and stage limits (AD-22). Pipeline-only, never read by the web. */
export type PipelineConfig = {
  costCapUsd: number;
  timeoutMs: number;
  retries: number;
  models: { vlm: string; text: string; qwenJudge: string; embedding: string; speech: string; jev: string };
  embeddingDimensions: number;
  pricesUsdPerMillionTokens: Prices;
  frameWidth: number;
  sceneCapMs: number;
  chunkMs: number;
  frameChangeThreshold: number;
  candidates: number;
  taglineTop: number;
};

export function loadPipelineConfig(root: string): PipelineConfig {
  const c = JSON.parse(readFileSync(join(root, "config/pipeline.json"), "utf8")) as PipelineConfig;
  for (const [role, name] of Object.entries(c.models)) {
    if (/latest$/i.test(name)) throw new Error(`config/pipeline.json: models.${role} must be a pinned name, not an alias`);
    if (!c.pricesUsdPerMillionTokens[name]) throw new Error(`config/pipeline.json: no price for ${name}`);
  }
  if (!(c.costCapUsd > 0)) throw new Error("config/pipeline.json: costCapUsd must be above 0");
  return c;
}
