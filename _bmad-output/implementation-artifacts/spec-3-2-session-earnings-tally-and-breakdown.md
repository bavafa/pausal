---
title: 'Story 3.2: Session earnings tally and breakdown'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'e4d82e662ee92e61c8f111c73fbfb225791affdd'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The viewer cannot see what their pauses would have earned, so the cost of holding an ad back stays invisible (F10, FR-23 to FR-25, UX-DR13).

**Approach:** The ad pause view carries the scene's simulated price and split from `decisions`. A pure `earnings.ts` turns the session pause log (Story 3.1, App state) into the tally line and per-pause rows. A tally button below the player shows the line and expands in place to the rows.

## Boundaries & Constraints

**Always:**
- The tally reads only the session pause log; it resets on reload. Each pause event is one row, a second pause in a scene counts again.
- Agent decisions on wording: no pauses gives "Simulated earnings: no pauses yet"; otherwise "Simulated earnings: N ad(s) shown ($X.XX), M held back ($0.00)", where X is the sum of shown prices, so the held-back zero sits next to its count as in the UX example. Money is US dollars from integer cents.
- Row: playback time `m:ss`, then "Ad: <product name>" or the policy reason text, then "Simulated $X.XX (platform $P.PP, publisher $Q.QQ)". A no-ad row uses `ZERO_EARNING` and `splitPrice(ZERO_EARNING)`. A row from another clip in the same load adds the clip title.
- Every rendered figure is formatted from a `SimulatedPrice` or `SimulatedSplit` value, never a bare number, and every line with a figure carries the word "Simulated".
- The ad view takes `price` and `split` from the resolved scene; an ad scene missing either fails closed to the analysis unavailable note, as a missing product already does.
- The tally is a button with `aria-expanded`, at least 44 px tall; the list renders right below it.
- The log is session-wide (all clips in this page load); the line totals every row.

**Never:** no storage, network or analytics; no change to `decisions`, `resolvePause` or `decide`; no price computed in the web.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior |
|----------|--------------|---------------------------|
| No pauses | `[]` | "Simulated earnings: no pauses yet", no rows |
| Mixed | 2 ad pauses at 108 cents, 1 sensitive | "Simulated earnings: 2 ads shown ($2.16), 1 held back ($0.00)" |
| Singular | 1 ad, 0 held back | "Simulated earnings: 1 ad shown ($1.08), 0 held back ($0.00)" |
| Ad row | ad at 2000 ms, 108 cents | "0:02", "Ad: Everyday Skillet", "Simulated $1.08 (platform $0.76, publisher $0.32)" |
| No-ad row | sensitive at 7500 ms | "0:07", "No ad here: sensitive scene.", "Simulated $0.00 (platform $0.00, publisher $0.00)" |
| Repeat pause | same scene paused twice | two rows, counted twice |
| Ad scene without price | ad outcome, `price: null` | pause view is the analysis unavailable note |

</frozen-after-approval>

## Code Map

- `apps/web/src/pause-view.ts` -- add `price: SimulatedPrice; split: SimulatedSplit` to the `ad` variant from `r.scene.price` and `r.scene.split`; fail closed when null.
- `apps/web/src/earnings.ts` (new) -- `dollars(v: SimulatedPrice)`, `tallyLine(log)`, `rows(log, currentClipId, clipTitle)`; uses `ZERO_EARNING` and `splitPrice` from `policy`.
- `apps/web/src/EarningsTally.tsx` (new) -- the button and the list.
- `apps/web/src/App.tsx` -- read `pauses` and pass it to `WatchScreen`.
- `apps/web/src/WatchScreen.tsx` -- render `EarningsTally` after the "AI-generated" line, above the scene panel.
- `apps/web/src/session.ts` -- unchanged log shape; a pause entry's `view` is fixed at the pause.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/src/pause-view.ts`, `pause-view.test.ts` -- price and split on the ad view; the missing price row.
- [x] `apps/web/src/earnings.ts`, `earnings.test.ts` -- every other matrix row.
- [x] `apps/web/src/EarningsTally.tsx`, `WatchScreen.tsx`, `App.tsx` -- wiring.

**Acceptance Criteria:**
- Given the fixture, when I pause on the ad, then on a sensitive scene, then on the ad again, then the line reads "Simulated earnings: 2 ads shown ($2.16), 1 held back ($0.00)", and tapping it lists three rows; a product page round trip adds no row.

## Implementation Notes

- The fixture price at 2 s is 108 cents (split 76 and 32), not the 96 first written in the matrix; the rows were corrected before implementation.
- `earningsRows` takes a `titleOf` function so the test needs no clip list; `EarningsTally` passes a lookup over `CLIPS`.
- The expand affordance is a "Details" or "Hide" word in accent `label` (hidden from screen readers, which get `aria-expanded`). A chevron glyph rendered as a dot in Raleway at phone size.
- The tally button is disabled while there are no pauses.
- Browser check at 1280 px: paused at 2 s (ad), 7.5 s (sensitive) and 2.5 s (ad); the line read "Simulated earnings: 2 ads shown ($2.16), 1 held back ($0.00)"; a product page round trip added no row; Details listed three rows. At 375 px the button is 44 px tall, rows stack, no horizontal overflow. No console errors.

## Spec Change Log

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Chevron glyph too small to read as an expand control on phone | low | Patched: replaced with a "Details" or "Hide" label. |
| A seek while paused to another scene shows a new card but the row keeps the first pause's view | low | Rejected: a pause event is the pause, not each seek (Web state convention); the row matches what was shown when the viewer paused. |
| `EarningsTally` markup has no automated test | low | Rejected: logic is in `earnings.ts` with full matrix tests; markup checked in the browser and in Story 5.5. |
| Tally changes are not announced | false | EXPERIENCE asks for the polite live region on the pause view only; the tally is read on demand. |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test` -- expected: all pass.

**Manual checks:**
- Dev server at 1280 px and 375 px: run the acceptance criterion; no console errors.
