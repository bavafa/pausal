---
title: 'Pause view: ad card or pause note'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '7791896'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Pausing the clip shows nothing. The decision the system made for that moment is invisible.

**Approach:** On pause, call `resolvePause` with the displayed-frame time and render over the dimmed frozen frame either the simulated ad card for the top product or a small pause note with one reason in policy wording. Play, Space or Escape closes it at once.

## Boundaries & Constraints

**Always:** Pause time is the `requestVideoFrameCallback` media time of the last presented frame when available, else `currentTime`, in integer ms. The outcome comes only from `resolvePause`; the web evaluates no rule. `decisions` null (Story 1.7) gives the analysis unavailable note on every pause. An `ad` whose product file is missing fails closed to the analysis unavailable note. No overlay while playing or when the clip has ended. Frozen frame: video filter `saturate(.35) brightness(.7)` plus the `frozen-scrim` layer. Laptop (1024 px and up): ad card centered at 78 percent width, image left 38 percent, "Sponsored", "Simulated ad", Lora title, tagline, View product button (no-op), QR placeholder at 35 percent opacity marked as a demo, "Shown because" line. Under 1024 px: card inset 8 px with the native playback bar left visible, image left 40 percent, tagline, QR and "Shown because" hidden. Pause note: "Paused" and one line, no red. Reason wording: "No ad here: analysis unavailable.", "No ad here: sensitive scene.", "No ad here: nothing fits well.", "No ad here: no active campaign." Overlay text goes to a polite live region; focus does not move; Tab reaches View product; no fade with reduced motion; targets at least 44 px; model-derived text (the tagline) renders as text. Docs: no em dashes, no contractions.

**Decisions (agent, user would not notice):** "Shown because" line is "Shown because this scene matches: <primary>, <secondary>." from `panel.contextLabel`. After a seek while paused, the overlay updates to the new frame. Clicks on the frozen frame outside the card still toggle play (overlay ignores pointer events except the card). Product images for the clip are preloaded on the watch screen. Fixture product images become simple hand-drawn SVGs in `apps/web/public/products/` and the product `imagePath` values change to `.svg`.

**Never:** No product page, price display, QR code or earnings (Epic 3), no ranked list (Epic 2), no `dangerouslySetInnerHTML`, no new dependency.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ad | fixture at 2500 ms | ad card, Everyday Skillet, tagline | N/A |
| Each reason | 7500, 12500, 17500, 22500 ms | that reason's wording | N/A |
| Look-back | 30500 ms (previous scene sensitive, ended 500 ms before) | sensitive scene note | N/A |
| Fallback tagline | 34000 ms | ad card, tagline "Everyday Skillet" | N/A |
| No decisions | `decisions` null | analysis unavailable note | N/A |
| Missing product | ad for an unknown product ID | analysis unavailable note | N/A |
| Ended | pause event with `ended` true | no overlay | N/A |

</frozen-after-approval>

## Code Map

- `packages/policy/src/pause.ts` -- `resolvePause(decisions, tMs)` returns `{ outcome, scene }`. Reuse.
- `apps/web/src/WatchScreen.tsx` -- video ref, toggle and Space handler; add the overlay state, Escape and pause events here.
- `apps/web/src/clips.ts` -- glob loading pattern and `videoSrc` (generalize to `assetUrl` for images).
- `data/products/*.json` -- `imagePath` to update; product files are not hashed, so `decide --check` stays green.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/public/products/fixture-*.svg`, `data/products/*.json` -- images and paths.
- [x] `apps/web/src/clips.ts` -- `loadProducts()` (validated, keyed by ID), `assetUrl`.
- [x] `apps/web/src/pause-view.ts` -- pure `pauseView(decisions, products, tMs)` giving ad or note content, and `REASON_TEXT`.
- [x] `apps/web/src/PauseOverlay.tsx` -- ad card, pause note, live region text.
- [x] `apps/web/src/WatchScreen.tsx` -- frame time, pause, seeked, play, Escape, preload, filter.
- [x] `apps/web/src/index.css` -- fade keyframes under `motion-safe`.
- [x] `apps/web/src/pause-view.test.ts` -- matrix rows except Ended (checked in the browser).

**Acceptance Criteria:**
- Given the fixture in a browser at laptop and phone widths, when I pause in each scene, then the card or note matches the matrix, and play, Space or Escape closes it at once.
- Given a pause, when the overlay shows, then focus stays where it was and the next Tab reaches View product on an ad card.
- Given `pnpm typecheck && pnpm lint && pnpm test && pnpm decide --check`, when run, then all pass.

## Implementation Notes

- Implemented and reviewed inline in the main session (user asked for no check-ins).
- `pause-view.ts` is the only place the web turns a `resolvePause` result into content; `WatchScreen` owns the frame time and events.
- Checked in the browser pane (Chrome) at 1280 px light and 375 px dark: every fixture scene gives the matrix outcome, the overlay renders 2 to 3 ms after `pause` (MutationObserver on the live region), play, Space and Escape close it, the clip ending shows no overlay, View product is 44 px tall, Tab goes from the video's native controls to View product, and the live region carries the overlay text.
- Phone card bottom edge sits 72 px above the frame bottom so Chrome's native time row and scrubber stay visible; 48 px covered the play button row.
- Pause note gets `w-max` so the reason line does not wrap at half the frame width.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | edge | The first frame's `requestVideoFrameCallback` fires while a fresh clip is paused and opened the overlay on load | medium | Seen in the browser: Escape on load started playback because the view was open; only a `pause` now opens it, seeks update an open view | patch |
| 2 | edge | Escape started playback with no overlay open | low | Same root as #1 plus an explicit `open` check | patch |
| 3 | blind | Space with focus on View product presses the button instead of resuming | false | Standard button semantics; Escape and a click on the frame resume, and Epic 3 gives the button its action | reject |
| 4 | blind | Live region re-announces on each seek during the pause view | low | One polite line per seek; matches the shown text | reject |
| 5 | gap | Ended row is not in the unit tests | low | Needs a media element; checked in the browser and recorded above | reject |
| 6 | edge | Phone treatment is checked in Chrome only; native control bar heights differ in Safari | maybe-false | Settle with an iPhone Safari check of the 72 px gap | defer |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test && npx -y pnpm@12.23.0 decide --check && npx -y pnpm@12.23.0 -r build` -- expected: exit 0

**Manual checks (if no CLI):**
- Browser pane at 1280 and 375 px, light and dark: pause in each fixture scene, then play, Space and Escape.
