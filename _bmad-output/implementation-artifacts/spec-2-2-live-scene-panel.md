---
title: 'Story 2.2: Live scene panel'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '1542327bbdb3469d661bd69c53e464c4ff663a26'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The watch screen shows nothing about the current scene while the clip plays (F3, UX-DR6).

**Approach:** Track the current scene from the displayed-frame time with `sceneAt`, map its `panel` to display text in a pure `scene-panel.ts`, and render a slim strip under the video that re-renders only when the scene changes.

## Boundaries & Constraints

**Always:**
- Read only `decisions` through `sceneAt`; text comes only from `panel` (`contextLabel`, `moodLabel`, `safeTag`).
- Layout as the mockup: a flex-wrap strip with a bottom border, eyebrow keys "Scene" and "Sentiment" (uppercase, tracked, muted), the context label (primary, then secondary, joined by ", ", first letter capitalized), the mood label, and the safe tag as an accent outline pill with full rounding. Below it, "Based on this scene and the previous 3" in muted `label`.
- Safe tag wording (agent decision): safe "Brand safe", caution "Caution", unsafe "Not brand safe". One pill style for all three.
- "Analysis unavailable for this scene." replaces the strip when `decisions` is null, the time is outside every scene, or the scene outcome is `analysisUnavailable`.
- The strip is a labelled `section` ("Scene panel") with no `aria-live`; the existing polite live region keeps announcing pauses only.
- Time source: the `requestVideoFrameCallback` media time when available, plus `timeupdate` and `seeked` as fallback. State changes only when the scene ID changes.

**Never:** no free-text description, `freeLabel` or judge reason; no per-frame re-render; no change to the pause view.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output |
|----------|--------------|-----------------|
| Safe scene with secondary | kitchen, cooking, Relaxed, safe | "Kitchen, cooking", "Relaxed", "Brand safe" |
| Primary only, unsafe | beach, Tense, unsafe | "Beach", "Tense", "Not brand safe" |
| Caution | caution | "Caution" |
| Unavailable outcome | `analysisUnavailable` scene | "Analysis unavailable for this scene." |
| No decisions or outside clip | null | "Analysis unavailable for this scene." |

</frozen-after-approval>

## Code Map

- `apps/web/src/WatchScreen.tsx` -- holds the video and the rVFC loop (`frameMs`); add `sceneId` state updated from frame time, `timeupdate` and `seeked`; replace the `!decisions` paragraph with `<ScenePanel>`.
- `apps/web/src/scene-panel.ts` (new) -- pure `scenePanel(scene: DecisionScene | null)` returning `{ kind: "unavailable" } | { kind: "scene", context, mood, safe }`.
- `apps/web/src/ScenePanel.tsx` (new) -- renders it; reuse the eyebrow classes from `PauseOverlay.tsx`.
- `apps/web/src/pause-view.test.ts` -- pattern for loading the fixture decisions in a test.
- `@pausal/policy` `sceneAt` -- the only scene lookup.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/src/scene-panel.ts` and `scene-panel.test.ts` -- mapping and every matrix row (fixture scenes where they exist).
- [x] `apps/web/src/ScenePanel.tsx` -- markup per Boundaries.
- [x] `apps/web/src/WatchScreen.tsx` -- scene tracking and render.

**Acceptance Criteria:**
- Given the fixture clip playing in the dev server, when it crosses from s0000000 to s0005000, then the panel changes from "Kitchen, cooking · Relaxed · Brand safe" style values to the next scene's values without a live-region announcement.

## Implementation Notes

- Browser check (dev server): seeks to 7.5, 12.5, 22.5, 34 and 2 s show the expected values, 22.5 s shows "Analysis unavailable for this scene."; playing from 4.2 s switches at 5.02 s; the live region stays empty; no console errors.
- `seeked` always updates the panel from `currentTime`: while paused, `requestVideoFrameCallback` fired late in the browser check and left the panel one seek behind.

## Spec Change Log

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Panel lagged one seek behind while paused | medium | Seen in the browser check; patched by tracking on `seeked`. |
| `sceneId` stale when the clip changes | false | `App.tsx` keys `WatchScreen` by `clipId`, so state resets per clip. |
| `timeupdate` and frame time could disagree at a boundary and flicker | false | `timeupdate` tracks only when `requestVideoFrameCallback` is missing; `seeked` uses the exact seek target. |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 test`, `typecheck`, `lint`, `-r build` -- all pass

**Manual checks:**
- Dev server at `http://localhost:5173/pausal/#/clip/000000000001`: seek across scenes; panel updates; no console errors.
