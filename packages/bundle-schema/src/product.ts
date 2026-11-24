import { array, at, done, nonEmptyString, object, type Issue, type Result } from "./check.ts";

/** `data/products/<product-id>.json` (AD-19). */
export type Product = {
  id: string;
  name: string;
  imagePath: string;
  description: string;
  keyFeatures: string[];
  attribution: string;
};

export function validateProduct(json: unknown): Result<Product> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  for (const k of ["id", "name", "imagePath", "description", "attribution"]) nonEmptyString(json[k], k, issues);
  if (array(json.keyFeatures, "keyFeatures", issues)) json.keyFeatures.forEach((f, i) => nonEmptyString(f, at("keyFeatures", i), issues));
  return done(issues, () => json as Product);
}
