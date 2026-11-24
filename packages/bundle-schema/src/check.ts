declare const intBrand: unique symbol;
/** A number proven to be a safe integer by validation (ms, cents, relevance). */
export type Int = number & { readonly [intBrand]: true };

export type Issue = { path: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; issues: Issue[] };
export type Rec = Record<string, unknown>;

export const at = (path: string, key: string | number): string =>
  typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key;

export function fail(issues: Issue[], path: string, message: string): false {
  issues.push({ path: path || "(root)", message });
  return false;
}

const bad = (issues: Issue[], v: unknown, path: string, want: string): false =>
  fail(issues, path, v === undefined ? "is missing" : `must be ${want}`);

export function object(v: unknown, path: string, issues: Issue[]): v is Rec {
  return (typeof v === "object" && v !== null && !Array.isArray(v)) || bad(issues, v, path, "an object");
}

export function array(v: unknown, path: string, issues: Issue[]): v is unknown[] {
  return Array.isArray(v) || bad(issues, v, path, "an array");
}

export function bool(v: unknown, path: string, issues: Issue[]): v is boolean {
  return typeof v === "boolean" || bad(issues, v, path, "a boolean");
}

export function nonEmptyString(v: unknown, path: string, issues: Issue[]): v is string {
  return (typeof v === "string" && v.trim() !== "") || bad(issues, v, path, "a non-empty string");
}

export function integer(v: unknown, path: string, issues: Issue[], min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): v is Int {
  return (Number.isSafeInteger(v) && (v as number) >= min && (v as number) <= max) || bad(issues, v, path, `an integer from ${min} to ${max}`);
}

export const nonNegInt = (v: unknown, path: string, issues: Issue[]): v is Int => integer(v, path, issues, 0);

export function num(v: unknown, path: string, issues: Issue[], min: number, max: number): v is number {
  return (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max) || bad(issues, v, path, `a number from ${min} to ${max}`);
}

export const prob = (v: unknown, path: string, issues: Issue[], min = 0, max = 1): v is number => num(v, path, issues, min, max);
export const cosine = (v: unknown, path: string, issues: Issue[]): v is number => num(v, path, issues, -1, 1);

export function oneOf<T>(v: unknown, options: readonly T[], path: string, issues: Issue[]): v is T {
  return options.includes(v as T) || bad(issues, v, path, `one of ${options.map((o) => JSON.stringify(o)).join(", ")}`);
}

export function literal<T>(v: unknown, expected: T, path: string, issues: Issue[]): v is T {
  return v === expected || bad(issues, v, path, JSON.stringify(expected));
}

/** Rejects any key not in `allowed`. */
export function onlyKeys(o: Rec, allowed: readonly string[], path: string, issues: Issue[]): void {
  for (const k of Object.keys(o)) if (!allowed.includes(k)) fail(issues, at(path, k), "is not allowed");
}

/** Clip ID is the video file hash prefix (AD-10): lowercase hex. */
export function clipId(v: unknown, path: string, issues: Issue[]): v is string {
  return (typeof v === "string" && /^[0-9a-f]+$/.test(v)) || bad(issues, v, path, "a lowercase hex hash prefix");
}

export const done = <T>(issues: Issue[], value: () => T): Result<T> =>
  issues.length ? { ok: false, issues } : { ok: true, value: value() };
