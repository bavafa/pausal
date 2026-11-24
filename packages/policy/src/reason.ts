/** Reason lines name at most this many matched features, to stay on one line. */
const MAX_FEATURES = 2;

/**
 * Template reason line (AD-7): only the fixed scene-type label and product-file features, never scene detail
 * and never a model call. Pass `features` already filtered to the product's `keyFeatures`.
 */
export function reasonLine(label: string | undefined, features: readonly string[]): string {
  const scene = label ? `Fits ${/^[aeiou]/i.test(label) ? "an" : "a"} ${label} scene` : "Fits this scene";
  const list = features.slice(0, MAX_FEATURES).join(", ");
  return list ? `${scene}: ${list}.` : `${scene}.`;
}
