/** Per-stage token and cost ledger with a hard cost cap (AD-22). */
export type StageUsage = { calls: number; inputTokens: number; outputTokens: number; costUsd: number };

export class CostCapError extends Error {}

export class Ledger {
  readonly stages: Record<string, StageUsage> = {};
  readonly capUsd: number;
  constructor(capUsd: number) {
    this.capUsd = capUsd;
  }

  get totalUsd(): number {
    return Object.values(this.stages).reduce((s, u) => s + u.costUsd, 0);
  }

  /** Throws before a call once the cap is reached, so a run never starts a call it cannot pay for. */
  guard(): void {
    if (this.totalUsd >= this.capUsd) throw new CostCapError(`cost cap of $${this.capUsd} reached ($${this.totalUsd.toFixed(4)} spent)`);
  }

  add(stage: string, inputTokens: number, outputTokens: number, costUsd: number): void {
    const u = (this.stages[stage] ??= { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 });
    u.calls += 1;
    u.inputTokens += inputTokens;
    u.outputTokens += outputTokens;
    u.costUsd += costUsd;
  }
}

export type RetryOptions = { timeoutMs: number; retries: number; baseDelayMs?: number };

/** Retryable: network errors, timeouts, 429 and 5xx. A 4xx other than 429 is a request bug and fails at once. */
export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body.slice(0, 300)}`);
    this.status = status;
  }
}

const retryable = (e: unknown): boolean => !(e instanceof HttpError) || e.status === 429 || e.status >= 500;

/** POSTs JSON with a timeout and bounded exponential backoff; returns the parsed body. */
export async function postJson(url: string, headers: Record<string, string>, body: unknown, opts: RetryOptions): Promise<unknown> {
  let last: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, (opts.baseDelayMs ?? 1000) * 2 ** (attempt - 1)));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(opts.timeoutMs),
      });
      const text = await res.text();
      if (!res.ok) throw new HttpError(res.status, text);
      return JSON.parse(text);
    } catch (e) {
      last = e;
      if (!retryable(e)) break;
    }
  }
  throw last;
}

/** Runs `fn` over items with at most `limit` in flight; results keep input order. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i] as T, i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}
