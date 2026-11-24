---
title: 'Scene lookup and pause resolution'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'a457a32b8e0e7a4ab7180e4d160f3d6536903012'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `policy` can evaluate one scene but nothing maps a pause time to a scene or to the final pause outcome, so an ad could come from a neighbouring scene.

**Approach:** Two pure functions in `policy`: `sceneAt(decisions, tMs)` returns the scene whose `[startMs, endMs)` contains `tMs`, or null; `resolvePause(decisions, tMs)` returns the pause outcome plus the scene it came from, applying the 1000 ms look-back rule (AD-16).

## Boundaries & Constraints

**Always:** Input is a validated `Decisions` (sorted, tiling `[0, durationMs)`). `resolvePause` reads only `decisions` and `tMs`: no thresholds, campaigns or analysis (AD-14). The look-back set is the scene at `tMs` plus every earlier scene whose `endMs > tMs - 1000` (half-open: a scene ending exactly 1000 ms before `tMs` no longer counts). An ad needs every scene in the set to have `outcome: "ad"` and the same `topProductId`; otherwise the result is the first reason in `REASONS` order found among the set's outcomes. No scene at `tMs` (negative, at or past `durationMs`, NaN) gives `analysisUnavailable` with `scene: null`. Docs: no em dashes, no contractions.

**Decisions:** When every scene in the set is an ad but the products differ, the result is `nothingFits`. The `session` argument from the AC is omitted until a story needs it; the signature is `resolvePause(decisions, tMs)`.

**Never:** No `rankAt` or hold logic (Epic 2). No `decide` command or fixtures (Story 1.5). No web changes. No new dependency, no I/O.

## I/O & Edge-Case Matrix

Scenes A `[0, 5000)` and B `[5000, 9000)`, clip 9000 ms.

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Boundary minus 1 ms | t 4999 | scene A, A's outcome | N/A |
| Boundary 0 ms | t 5000, A sensitive, B ad | scene B, `sensitiveScene` | N/A |
| Boundary plus 999 ms | t 5999, same as above | `sensitiveScene` | N/A |
| Boundary plus 1000 ms | t 6000, same as above | scene B, `ad` | N/A |
| Same product | t 5000, A and B ad for p1 | `ad` | N/A |
| Reason order | t 5000, A `noActiveCampaign`, B `nothingFits` | `nothingFits` | N/A |
| Short scene chain | A `[0,5000)` ad p2, B `[5000,5300)` ad p1, C `[5300,9000)` ad p1, t 5800 | look-back covers A, B and C; products differ, `nothingFits` | N/A |
| Different products | t 5000, A ad p2, B ad p1 | `nothingFits` | N/A |
| Outside clip | t -1, t 9000, t NaN | `analysisUnavailable`, scene null | N/A |
| Pending scene | scene with outcome `analysisUnavailable` | `analysisUnavailable` | N/A |

</frozen-after-approval>

## Code Map

- `packages/policy/src/index.ts` -- add `export * from "./pause.ts"`.
- `packages/bundle-schema/src/decisions.ts` -- `Decisions`, `DecisionScene`, `Outcome`, `REASONS`: reuse, do not redefine.
- `packages/policy/src/rules.test.ts` -- test style and `vitest` import already allowed for `packages/policy/src/**/*.test.ts` by `.oxlintrc.json`.
- `tsconfig.base.json` -- no enums; `Int` brand from `bundle-schema` for integer fields in test fixtures (cast `as Int`).

## Tasks & Acceptance

**Execution:**
- [x] `packages/policy/src/pause.ts` -- `sceneAt(decisions, tMs): DecisionScene | null` and `resolvePause(...)` returning `{ outcome: Outcome; scene: DecisionScene | null }` -- the web reads product, price, split and tagline from `scene` when `outcome` is `ad`.
- [x] `packages/policy/src/index.ts` -- re-export.
- [x] `packages/policy/src/pause.test.ts` -- every matrix row; `sceneAt` at 0, `endMs - 1`, `endMs`, and outside the clip.

**Acceptance Criteria:**
- Given `pnpm typecheck && pnpm lint && pnpm test`, when run, then all pass with the new tests.
- Given `packages/policy/src/pause.ts`, when linted, then it imports only `@pausal/bundle-schema` and relative files.

## Implementation Notes

- Implemented directly in this session, not by a subagent: two functions and one test file.
- `PauseResult` is a union so an `ad` result always carries its scene; the web needs no null check on the ad path.
- A pause at exactly `durationMs` (the player stopped on the last frame) gives `analysisUnavailable`, as the matrix requires. The watch screen (Story 1.7) should not open a pause view on `ended`; recorded in `deferred-work.md`.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | edge | Pause at `tMs === durationMs` gives `analysisUnavailable` | low | Real, and the frozen matrix sets t 9000 to unavailable; the caller decides what an ended clip shows | defer |
| 2 | edge | Unvalidated, unsorted decisions break the look-back | false | Spec input contract is validated `Decisions`; `validateDecisions` enforces sorted tiling; contract now stated in the JSDoc | reject |
| 3 | blind | `PauseResult` allows `{ outcome: "ad", scene: null }` | low | Story 1.8 caller would need a null check on the ad path; one type change | patch |
| 4 | blind | JSDoc repeats 1000 and leaves the window edge unclear | low | Comment correction | patch |
| 5 | blind | No fractional or Infinity time tests | low | Web passes `currentTime * 1000`, a float; one assertion each | patch |
| 6 | blind | Lowest reason never tested against an ad | low | An ad beating `noActiveCampaign` would pass the suite | patch |
| 7 | blind | Earlier ad with a non-ad current scene untested | low | Same test as #6 covers both sides | patch |
| 8 | blind | Ad result product never asserted | low | One assertion on `scene.topProductId` | patch |
| 9 | blind | Null `topProductId` on two ads passes | false | `validateDecisions` rejects a null `topProductId` when outcome is `ad` (`decisions.ts` nullable check) | reject |
| 10 | blind | Diff omits spec and sprint status changes | false | Review diff is code only by design; workflow files are updated separately | reject |
| 11 | gap | No verification gaps found | false | Reviewer confirmed each likely regression fails a test | reject |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test` -- expected: exit 0
