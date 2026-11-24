import { validateDecisions, validateManifest, validateProduct, type Decisions, type Manifest, type Product } from "@pausall/bundle-schema";

const files = import.meta.glob<unknown>("../../../data/manifest/*.json", { eager: true, import: "default" });

/** Valid manifests sorted by title; an invalid one is left out with a console warning. */
export function loadClips(entries: Record<string, unknown> = files): Manifest[] {
  const clips: Manifest[] = [];
  for (const [path, json] of Object.entries(entries)) {
    const r = validateManifest(json);
    if (r.ok) clips.push(r.value);
    else console.warn(`Skipping invalid manifest ${path}`, r.issues);
  }
  return clips.sort((a, b) => a.title.localeCompare(b.title));
}

export const CLIPS = loadClips();

const decisionFiles = import.meta.glob<unknown>("../../../data/decisions/*.json", { eager: true, import: "default" });

/**
 * The clip's validated `decisions`, or null when it is missing, invalid or does not match the manifest.
 * Null means every pause shows "Analysis unavailable" (AD-4).
 */
export function loadDecisions(clip: Manifest, entries: Record<string, unknown> = decisionFiles): Decisions | null {
  const name = `/${clip.clipId}.json`;
  const path = Object.keys(entries).find((p) => p.endsWith(name));
  if (!path) return warn(`No decisions file for clip ${clip.clipId}`);
  const r = validateDecisions(entries[path]);
  if (!r.ok) return warn(`Invalid decisions ${path}`, r.issues);
  if (r.value.clipId !== clip.clipId || r.value.durationMs !== clip.durationMs) return warn(`Decisions ${path} do not match the manifest`);
  return r.value;
}

const warn = (...args: unknown[]) => (console.warn(...args), null);

/** A relative URL (video, product image) is served next to the app; an absolute one is used as is. */
export const assetUrl = (url: string, base: string = import.meta.env.BASE_URL) => (/^[a-z][a-z0-9+.-]*:/i.test(url) ? url : base + url.replace(/^\//, ""));

const productFiles = import.meta.glob<unknown>("../../../data/products/*.json", { eager: true, import: "default" });

/** Valid product files keyed by ID; an invalid one is left out, so an ad for it fails closed. */
export function loadProducts(entries: Record<string, unknown> = productFiles): Map<string, Product> {
  const products = new Map<string, Product>();
  for (const [path, json] of Object.entries(entries)) {
    const r = validateProduct(json);
    if (r.ok) products.set(r.value.id, r.value);
    else console.warn(`Skipping invalid product ${path}`, r.issues);
  }
  return products;
}

export const PRODUCTS = loadProducts();
