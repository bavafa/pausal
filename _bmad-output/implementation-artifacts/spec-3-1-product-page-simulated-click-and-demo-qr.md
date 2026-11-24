---
title: 'Story 3.1: Product page, simulated click and demo QR'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '309f1a001dc663dc0f8edb752a199d0b0a996568'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** View product on the ad card does nothing, so the viewer cannot look closer at the advertised product, no simulated click is recorded, and the demo QR is not clearly marked as not a real link (FR-14, FR-15, UX-DR8, UX-DR12).

**Approach:** Add a hash route `#/clip/<clipId>/product/<productId>` that shows a product page while the watch screen stays mounted but hidden, so its paused video, time and overlay survive the round trip. Add a session pause log in `App`: every real pause appends an entry, and View product sets a `SimulatedClick` from `policy` on the latest entry before navigating.

## Boundaries & Constraints

**Always:**
- Product page: Back link, product image (`alt` is the name), Lora title, description, key features as a list, the product `attribution` in muted `label`, and "Simulated click recorded." in muted `label`. Card surface, same page gutters as the watch screen. Focus moves to the title on open.
- Product page text renders through React text nodes only.
- Back link and browser Back both return to the watch screen in the same paused state with the same overlay. The Back link uses `history.back()` when the page was opened from the clip in this page load; otherwise it navigates to `#/clip/<clipId>` (a reload or a shared link).
- The click is recorded only by the View product button, never by the product page loading.
- `SimulatedClick = { productId: string; simulated: true }` lives in `bundle-schema` next to `SimulatedPrice`; `policy` exports `clickFor(productId)` (AD-8).
- The session pause log is App state for the page load (resets on reload; Story 3.2 reads it). One entry per real pause event that opens the pause view: `{ clipId, tMs, view, click }`. A seek while paused updates the view but adds no entry.
- While the watch screen is hidden, its Space and Escape shortcuts do nothing.
- Demo QR keeps the existing pattern (it encodes nothing) at 35 percent opacity, laptop only, with the visible text "Demo QR, not a real link".
- Agent decisions: an unknown product ID shows "Product not found." with the Back link; the list items stay non-links (the story opens the page from the ad card only).

**Never:** no network request, analytics or storage for the click; no change to `resolvePause`, `rankAt`, `decide` or the decisions schema; no tally or breakdown UI (Story 3.2).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|----------|--------------|---------------------------|
| Route parse | `#/clip/a/product/p` | `{ page: "product", clipId: "a", productId: "p" }` |
| Route parse | `#/clip/a`, `#/`, `#/clip/a/x` | clip, picker, picker |
| Click on latest pause | log with 2 entries | only the last entry gets the click; earlier entries unchanged |
| Click with empty log | `[]` | log unchanged |
| Unknown product | `#/clip/a/product/missing` | "Product not found." and Back link |

</frozen-after-approval>

## Code Map

- `apps/web/src/route.ts` -- add the product route to `Route` and `parseRoute`; add `productHref(clipId, productId)`.
- `apps/web/src/App.tsx` -- hold `pauses` state and a `fromClip` ref; render the watch screen inside a wrapper with `hidden` on the product route, in the same tree position for both routes so it does not remount; render `ProductPage` beside it.
- `apps/web/src/session.ts` (new) -- `PauseEntry` type and pure `withClick(log, click)`.
- `apps/web/src/ProductPage.tsx` (new) -- markup; reuse `assetUrl`, the eyebrow and Back link classes already used in `WatchScreen.tsx`.
- `apps/web/src/WatchScreen.tsx` -- take `onPause(entry)` and `onViewProduct(productId)` props; append an entry in `onPause` only when `showPause` produces a view; skip shortcuts when the video is not visible (`checkVisibility()`).
- `apps/web/src/PauseOverlay.tsx` -- wire the View product button to `onViewProduct(view.product.id)`; update the QR text.
- `packages/bundle-schema/src/decisions.ts` -- add `SimulatedClick` next to `SimulatedPrice`.
- `packages/policy/src/money.ts` -- add `clickFor`; export it from `index.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `packages/bundle-schema/src/decisions.ts`, `packages/policy/src/money.ts`, `index.ts`, `money.test.ts` -- `SimulatedClick` and `clickFor` with a test.
- [x] `apps/web/src/route.ts` and `route.test.ts` -- product route and the parse rows.
- [x] `apps/web/src/session.ts` and `session.test.ts` -- log type and `withClick` rows.
- [x] `apps/web/src/ProductPage.tsx` -- page per Boundaries.
- [x] `apps/web/src/PauseOverlay.tsx`, `WatchScreen.tsx`, `App.tsx` -- wiring, hidden watch screen, pause log.

**Acceptance Criteria:**
- Given the fixture paused on an ad at laptop width, when View product is selected, then the product page shows and the log's latest entry carries the click; when Back (link or browser) is used, then the watch screen shows the same frame time and the same ad card, and the log has no new entry.
- Given the product page, when Space is pressed, then the hidden video does not play.

## Implementation Notes

- Route tests went into the existing `clips.test.ts` (where `parseRoute` was already tested), not a new `route.test.ts`. The unknown product row is covered by `ProductPage.test.tsx` with `renderToStaticMarkup` (no DOM library needed).
- `App` now re-renders on every pause, so `loadDecisions` moved into a `useMemo` per clip; otherwise each pause handed the watch screen a new `decisions` object and re-ran its effects.
- `pauses` is written only (`[, setPauses]`) until Story 3.2 renders the tally, which keeps lint clean.
- Browser check at 1280 px: paused at 2.000 s on the skillet ad, View product opened `#/clip/000000000001/product/fixture-pan` with focus on the title; Space left the hidden video paused; the Back link and browser Back both returned to 2.0003 s with the same ad card. `#/.../product/missing` shows "Product not found." At 375 px the page stacks with no horizontal overflow. No console errors.

## Spec Change Log

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| A reload or shared link of the product page says "Simulated click recorded." though no click was logged | medium | Patched: the line renders only when `fromClip`; test added. |
| A seek while paused changes the ad card, so a later click can name a product other than the logged pause's `view` | low | Rejected for now: the click carries its own `productId`; Story 3.2 decides which view the breakdown shows. |
| `fromClip` never resets, so a hand-typed product URL later in the same load uses `history.back()` | low | Rejected: needs a typed URL after a click in the same load; Back still lands on a previous page. |
| `checkVisibility()` is missing in Safari before 17.4 and would throw in the key handler | low | Rejected: Safari 17.4 shipped in 2024; the stack targets current browsers. |
| Focus is not returned to View product after Back | low | Rejected: the paused card is still reachable by Tab; a fix needs a ref across the hidden screen. |
| App wiring (pause log append, click, hidden screen) has no automated test | low | Rejected: covered by the browser check here and by the Story 5.5 browser test. |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test` -- expected: all pass.

**Manual checks:**
- Dev server at 1280 px and 375 px: run the acceptance criteria above; no console errors and no network request after load.
