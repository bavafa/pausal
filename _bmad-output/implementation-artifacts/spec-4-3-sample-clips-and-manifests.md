---
title: 'Story 4.3: Sample clips and manifests'
type: 'feature'
created: '2026-11-24'
status: 'review'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The demo needs real clips with manifests (AD-10, AD-19).

**Approach:** Copy each clip to `apps/web/public/media/<hash12>.mp4`, where the ID is the first 12 hex characters of its SHA-256, and write `data/manifest/<id>.json` with the duration from ffprobe. The limit was raised to 5 minutes and 25 MB (FR-1, 2026-11-24).

</frozen-after-approval>

## Implementation Notes

- The 4 clips the author supplied on 2026-11-24 are test material, not the final set: their metadata shows YouTube downloads (an action short, a scene from a commercial film, a short film, and one with no tags). The author will replace them with AI-generated clips before the site link is shared.
- Until then everything made from them lives only on the local branch `local/test-clips`, which is never pushed: manifests (titled "TEST clip N (not AI-generated, local only)"), analysis, decisions, product files and campaigns. The videos are kept out of git with `.git/info/exclude`.
- Clips: 81 s, 139 s, 84 s, 72 s; 2.6 to 9.7 MB; all have audio, so all manifests set `hasDialogue: true` and silence detection decides where speech is.
- Still to do with the final clips: note the AI tool and its terms in `docs/data-sources.md`, write the manifests on `main`.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| The supplied clips are not AI-generated and one is a commercial film | high | Routed: the author decided they are for testing only; kept on a never-pushed local branch. |
