import { array, at, done, fail, nonEmptyString, object, type Issue, type Result } from "./check.ts";

/** `data/products/<product-id>.json` (AD-19). */
export type Product = {
  id: string;
  name: string;
  /** Two to four words a viewer reads at a glance, written by the pipeline; the web falls back to `name`. */
  shortName?: string;
  imagePath: string;
  description: string;
  keyFeatures: string[];
  attribution: string;
};

export function validateProduct(json: unknown): Result<Product> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  for (const k of ["id", "name", "imagePath", "description", "attribution"]) nonEmptyString(json[k], k, issues);
  if (json.shortName !== undefined && nonEmptyString(json.shortName, "shortName", issues) && json.shortName.length > 40) fail(issues, "shortName", "must be at most 40 characters");
  if (array(json.keyFeatures, "keyFeatures", issues)) json.keyFeatures.forEach((f, i) => nonEmptyString(f, at("keyFeatures", i), issues));
  return done(issues, () => json as Product);
}
