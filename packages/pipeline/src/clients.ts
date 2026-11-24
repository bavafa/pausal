import { postJson, type Ledger, type RetryOptions } from "./call.ts";

export type Prices = Record<string, { input: number; output: number }>;
export type ClientConfig = { retry: RetryOptions; prices: Prices; ledger: Ledger };

const cost = (prices: Prices, model: string, inTok: number, outTok: number): number => {
  const p = prices[model];
  if (!p) throw new Error(`no price for model ${model} in config/pipeline.json`);
  return (inTok * p.input + outTok * p.output) / 1e6;
};

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "input_audio"; input_audio: { data: string } };
export type ChatMessage = { role: "system" | "user"; content: string | ContentPart[] };

/** Model Studio through its OpenAI-compatible workspace endpoint; keys come only from the environment (`.env`). */
export class Qwen {
  private readonly baseUrl: string;
  private readonly key: string;
  private readonly cfg: ClientConfig;
  constructor(baseUrl: string, key: string, cfg: ClientConfig) {
    this.baseUrl = baseUrl;
    this.key = key;
    this.cfg = cfg;
  }

  private async post(path: string, body: Record<string, unknown>, stage: string): Promise<Record<string, unknown>> {
    this.cfg.ledger.guard();
    const res = (await postJson(`${this.baseUrl.replace(/\/$/, "")}${path}`, { authorization: `Bearer ${this.key}` }, body, this.cfg.retry)) as Record<string, unknown>;
    const u = (res.usage ?? {}) as Record<string, number>;
    const inTok = u.prompt_tokens ?? u.input_tokens ?? u.total_tokens ?? 0;
    const outTok = u.completion_tokens ?? u.output_tokens ?? 0;
    this.cfg.ledger.add(stage, inTok, outTok, cost(this.cfg.prices, body.model as string, inTok, outTok));
    return res;
  }

  /** One chat completion with thinking off (it is on by default and costs hidden tokens). */
  async chat(model: string, messages: ChatMessage[], stage: string, json = false): Promise<string> {
    const body: Record<string, unknown> = { model, messages, enable_thinking: false, temperature: 0 };
    if (json) body.response_format = { type: "json_object" };
    const res = await this.post("/chat/completions", body, stage);
    const text = (res.choices as { message?: { content?: unknown } }[] | undefined)?.[0]?.message?.content;
    if (typeof text !== "string" || text.trim() === "") throw new Error(`${model} returned no text`);
    return text;
  }

  async embed(model: string, inputs: string[], dimensions: number, stage: string): Promise<number[][]> {
    const res = await this.post("/embeddings", { model, input: inputs, dimensions, encoding_format: "float" }, stage);
    const data = res.data as { index: number; embedding: number[] }[] | undefined;
    if (!data || data.length !== inputs.length) throw new Error(`${model} returned ${data?.length ?? 0} embeddings for ${inputs.length} inputs`);
    return [...data].sort((a, b) => a.index - b.index).map((d) => d.embedding);
  }
}

/** One TypeSafe System One request; `questions` are named and answered in parallel on the same `state`. */
export class Jev {
  private readonly key: string;
  private readonly model: string;
  private readonly cfg: ClientConfig;
  constructor(key: string, model: string, cfg: ClientConfig) {
    this.key = key;
    this.model = model;
    this.cfg = cfg;
  }

  async ask(state: unknown, questions: Record<string, unknown>, stage: string): Promise<Record<string, JevAnswer>> {
    this.cfg.ledger.guard();
    const res = (await postJson(
      "https://api.typesafe.ai/v1/systemone",
      { authorization: `Bearer ${this.key}` },
      { model: this.model, state, questions },
      this.cfg.retry,
    )) as { model?: string; answers?: Record<string, JevAnswer>; usage?: { input_tokens?: number; output_tokens?: number } };
    const inTok = res.usage?.input_tokens ?? 0;
    const outTok = res.usage?.output_tokens ?? 0;
    this.cfg.ledger.add(stage, inTok, outTok, cost(this.cfg.prices, this.model, inTok, outTok));
    // An alias silently moving to a new model would break repeatability (AD-22).
    if (res.model !== undefined && res.model !== this.model) throw new Error(`Jev answered with ${res.model}, expected ${this.model}`);
    if (!res.answers) throw new Error("Jev returned no answers");
    return res.answers;
  }
}

export type JevAnswer =
  | { type: "noul"; noul: number }
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | { type: "score"; score: number; confidence: number; probabilities: Record<string, number> };

/** Reads keys from the repo `.env` only (AD-22); never prints them. */
export function readKeys(envFile: string): { qwenKey: string; qwenBaseUrl: string; jevKey: string } {
  process.loadEnvFile(envFile);
  const get = (k: string): string => {
    const v = process.env[k];
    if (!v) throw new Error(`${k} is missing from .env`);
    return v;
  };
  return { qwenKey: get("DASHSCOPE_API_KEY"), qwenBaseUrl: get("DASHSCOPE_BASE_URL"), jevKey: get("TYPESAFE_API_KEY") };
}
