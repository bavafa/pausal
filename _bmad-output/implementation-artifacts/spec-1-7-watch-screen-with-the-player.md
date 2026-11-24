---
title: 'Watch screen with the player'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'dd222cd'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Selecting a clip opens a stub page with a title. There is no player, no `decisions` loading and the fixture manifest points at a placeholder video URL.

**Approach:** A watch screen that loads the clip's manifest and validated `decisions`, plays the video at 16:9 with native controls, toggles play on click, tap or Space, and links back to the picker. The fixture clip gets a small generated test video so the screen can be used end to end.

## Boundaries & Constraints

**Always:** Video at full content width, 16:9 (`aspect-video`), the same box in every state. Native controls, `playsInline`, no autoplay, no loop, no next clip. Click or tap on the video and Space (when focus is not on a control, link or the video itself) toggle play and pause. `decisions` for the clip is validated with `validateDecisions`; it must also match the manifest `clipId` and `durationMs`. Missing, invalid or mismatched `decisions` shows "Analysis unavailable for this scene." under the player and is passed on as `null` so every pause in Story 1.8 shows no ad. The web never reads `analysis`. Docs: no em dashes, no contractions.

**Decisions (agent, user would not notice):** `decisions` files are bundled with `import.meta.glob` like manifests, so nothing is fetched after load except the video. A relative `videoUrl` resolves against `import.meta.env.BASE_URL`; an absolute URL is used as is. The fixture video is a 35 s, 640x360 `testsrc2` pattern whose hue changes every 5 s (one look per fixture scene), H.264 at about 1 MB, generated with ffmpeg and committed at `apps/web/public/media/000000000001.mp4`; the manifest `videoUrl` becomes `media/000000000001.mp4`. The `ended` state is not a pause (deferred item from Story 1.4); Story 1.8 reads the paused flag only while not ended.

**Never:** No pause overlay (Story 1.8), no scene panel or product list (Epic 2), no custom control bar, no new dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid clip | fixture manifest and decisions | player, no unavailable line | N/A |
| Invalid decisions | fails `validateDecisions` | "Analysis unavailable for this scene.", decisions `null` | console warning naming issues |
| Missing decisions | no file for the clip | same as invalid | console warning |
| Mismatch | decisions `clipId` or `durationMs` differ from manifest | same as invalid | console warning |
| Relative URL | `media/x.mp4`, base `/pausall/` | `/pausall/media/x.mp4` | N/A |
| Absolute URL | `https://host/x.mp4` | unchanged | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/src/App.tsx` -- clip route renders a stub; replace with `WatchScreen`.
- `apps/web/src/clips.ts` -- manifest glob pattern to copy for decisions.
- `packages/bundle-schema/src/decisions.ts` -- `validateDecisions`, `Decisions`.
- `data/manifest/000000000001.json` -- `videoUrl` placeholder to replace; `durationMs` 35000 must stay (decide checks it).

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/public/media/000000000001.mp4`, `data/manifest/000000000001.json` -- generated fixture video and its URL.
- [x] `apps/web/src/clips.ts` -- `loadDecisions(manifest, entries)` and `videoSrc(url, base)`.
- [x] `apps/web/src/WatchScreen.tsx` -- Back to clips, title, player, toggle handlers, unavailable line.
- [x] `apps/web/src/App.tsx` -- route to `WatchScreen`, "Clip not found." stays for unknown IDs.
- [x] `apps/web/src/clips.test.ts` -- matrix rows.

**Acceptance Criteria:**
- Given the fixture clip in a browser, when I click the video or press Space, then it plays and pauses, and the player box keeps the same size.
- Given the network panel after load, when I play and pause, then no request other than the video is made.
- Given `pnpm typecheck && pnpm lint && pnpm test && pnpm decide --check`, when run, then all pass.

## Implementation Notes

- Implemented and reviewed inline in the main session (user asked for no check-ins).
- Fixture video command: `ffmpeg -f lavfi -i "testsrc2=size=640x360:rate=24:duration=35" -vf "hue=H='floor(t/5)*0.9'" -c:v libx264 -pix_fmt yuv420p -profile:v main -crf 38 -preset slow -g 48 -movflags +faststart -an apps/web/public/media/000000000001.mp4` (about 940 kB, burned-in timecode from `testsrc2`).
- Checked in the browser pane (Chrome): a click on the picture plays, a click on the native play button pauses once (no double toggle), Space with the body or the video focused toggles once and does not scroll, and the resource list after load adds only the video.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | edge | Firefox toggles a `<video controls>` on click natively; the click handler could toggle twice | maybe-false | Checked in Chrome only; settle with a Firefox run of the same click | defer |
| 2 | blind | `loadDecisions` runs on every App render | false | App re-renders only when the hash changes | reject |
| 3 | gap | Unavailable line is not covered by a component test | low | Rendering is one condition on the `null` that `loadDecisions` tests cover; no DOM test setup exists | reject |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test && npx -y pnpm@12.23.0 decide --check && npx -y pnpm@12.23.0 -r build` -- expected: exit 0

**Manual checks (if no CLI):**
- Browser pane: play and pause by click and Space; network list shows only the video after load.
