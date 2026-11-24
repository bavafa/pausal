import { validateManifest, type Manifest } from "@pausall/bundle-schema";

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
