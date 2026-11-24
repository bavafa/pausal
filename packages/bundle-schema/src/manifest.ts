import { bool, clipId, done, integer, literal, nonEmptyString, object, type Int, type Issue, type Result } from "./check.ts";

/** `data/manifest/<clip-id>.json`, hand-authored (AD-19). */
export type Manifest = {
  clipId: string;
  title: string;
  videoUrl: string;
  durationMs: Int;
  aiGenerated: true;
  hasDialogue: boolean;
  attributionKey: string;
};

export function validateManifest(json: unknown): Result<Manifest> {
  const issues: Issue[] = [];
  if (!object(json, "", issues)) return done(issues, () => json as never);
  clipId(json.clipId, "clipId", issues);
  nonEmptyString(json.title, "title", issues);
  nonEmptyString(json.videoUrl, "videoUrl", issues);
  integer(json.durationMs, "durationMs", issues, 1);
  literal(json.aiGenerated, true, "aiGenerated", issues);
  bool(json.hasDialogue, "hasDialogue", issues);
  nonEmptyString(json.attributionKey, "attributionKey", issues);
  return done(issues, () => json as Manifest);
}
