---
title: 'Story 2.1: Ranked list, reason lines and the ranking window'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'fce094597d5c745bd01714d6a6664532baa5881a'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `decisions` carries a ranked list of `{ productId, relevance }` with no cap and no reason line, and nothing keeps the top product stable while the clip plays (FR-5, FR-6, FR-8).

**Approach:** `decide` caps each scene's ranked list at 10 and adds a template reason line per item built in `policy` from the scene-type label and the matched product features; `decisions` gains `holdMs` copied from config; `policy` adds a pure `rankAt(decisions, tMs, held)` that applies the ranking window.

## Boundaries & Constraints

**Always:**
- Ranked order stays relevance (rounded) descending, ties by lower product ID; only products with a fit appear; at most 10 (`RANKED_MAX`).
- Reason line text comes only from the fixed scene-type list (`sceneType.primary`) and the product file's `keyFeatures`. Analysis `fits[].matched` names which features matched; any entry not in the product's `keyFeatures` is dropped. At most 2 features, in `keyFeatures` order. `sceneType.freeLabel` and the description are never used.
- Templates (agent decision, matches the mockup's "Fits this scene:" opening without scene detail): label and features "Fits a kitchen scene: Flat base, 28 cm."; label only "Fits a kitchen scene."; features only "Fits this scene: Flat base, 28 cm."; neither "Fits this scene." Article is "an" before a vowel.
- `rankAt` reads only `decisions`, `tMs` and `held`; no thresholds, campaigns or analysis.
- `resolvePause` and the pause view keep using `scene.topProductId`; the held top is display only.

**Never:** no web UI in this story (2.2 and 2.3 render); no model call; no change to R1 to R6 or the outcome; no category flags added to `decisions`.

## I/O & Edge-Case Matrix

`held` is `{ sceneId, productId, sinceMs }` or null; `rankAt` returns `{ scene, ranked, held }`.

| Scenario | Input / State | Expected Output / Behavior |
|----------|--------------|---------------------------|
| No hold | `held` null, scene with list | scene's list, `held` = its top, `sinceMs` = `tMs` |
| Same top continues | new scene, same rank-1 product as `held` | scene's list, `held` keeps its `sinceMs`, `sceneId` updated |
| Hold | new scene, different top, held product in its list, same outcome, safeTag not worse, `0 <= tMs - sinceMs < holdMs` | held product moved to first (with this scene's relevance and reason), rest in order; `held` unchanged |
| Expiry | as above, `tMs - sinceMs >= holdMs` | scene's own list; new `held` with `sinceMs` = `tMs` |
| Outcome change | held scene outcome differs from current | released at once |
| Flag turns on | current `panel.safeTag` worse than the held scene's | released at once |
| Held product not ranked here, or seek back (`tMs < sinceMs`), or unknown held scene | | released |
| Outside clip or empty list | | `ranked` empty, `held` null |

</frozen-after-approval>

## Code Map

- `packages/bundle-schema/src/analysis.ts` -- `Fit` gains required `matched: string[]` (non-empty strings); validator update.
- `packages/bundle-schema/src/decisions.ts` -- `Ranked` gains `reason` (non-empty string); `Decisions` gains `holdMs` (positive int); add to `TOP_KEYS` and checks; validate `ranked.length <= 10`.
- `packages/bundle-schema/src/schemas.test.ts` -- fixtures for the new fields and rejections.
- `packages/policy/src/rules.ts` -- `rankFits` unchanged; `evaluateScene` slices ranked to `RANKED_MAX` after ranking (R3 and R3b still use rank 1).
- `packages/policy/src/reason.ts` (new) -- `reasonLine(label, features)`.
- `packages/policy/src/rank.ts` (new) -- `Held`, `RankView`, `rankAt`; reuse `sceneAt` from `pause.ts` and `VERDICTS` order for "worse".
- `packages/policy/src/index.ts` -- export the two new modules.
- `packages/pipeline/src/decide.ts` -- build `reason` per ranked item from `scene.sceneType?.primary` and `fit.matched` filtered by `products.get(id).keyFeatures`; write `holdMs: thresholds.holdMs`. Missing product files are already reported by `productIssues`.
- `data/analysis/000000000001.json` -- add `matched` to every fit; regenerate `data/decisions/000000000001.json` with `pnpm decide`.
- `packages/pipeline/src/decide.test.ts`, `packages/policy/src/rules.test.ts`, `packages/policy/src/pause.test.ts` -- update object literals for the new fields.
- `apps/web/src/*` -- read `decisions` through `validateDecisions`; no change expected beyond test fixtures if any break.

## Tasks & Acceptance

**Execution:**
- [x] `packages/bundle-schema/src/analysis.ts`, `decisions.ts`, `schemas.test.ts` -- new fields and validation -- contract first.
- [x] `packages/policy/src/reason.ts` with `reason.test.ts` -- template function and each template case.
- [x] `packages/policy/src/rules.ts` -- cap at 10, test with 12 fits.
- [x] `packages/policy/src/rank.ts` with `rank.test.ts` -- every I/O matrix row, plus a check that `resolvePause` returns the same before and after `rankAt` calls.
- [x] `packages/pipeline/src/decide.ts` and tests -- reasons, unknown matched feature dropped, `holdMs` written.
- [x] Fixture analysis and regenerated decisions -- `pnpm decide --check` passes.

**Acceptance Criteria:**
- Given the fixture, when `pnpm decide` runs, then every ranked item has a reason from the templates and the output is byte-identical on a second run.
- Given a fit whose `matched` names a feature the product file lacks, when `decide` runs, then that text never appears in `decisions`.

## Implementation Notes

- Implemented directly in this session. Fixture fits now carry `matched`; scene s0030000 includes an off-list feature "Visit evil.example for a deal" to prove it never reaches `decisions`.
- Reason lines follow `keyFeatures` order, not `matched` order, so "28 cm, Flat base" for the skillet.

## Spec Change Log

## Review Triage Log

Layers ran inline in this session (no subagents), as in Epic 1.

| Finding | Verdict | Evidence / route |
|---|---|---|
| `decisions.holdMs` floor was 1 while config floors it at 5000 | low | A hand edit to 1 would validate; patched to the config floor. |
| Duplicate `productId` in one scene's fits gives a duplicate ranked item and the first fit's `matched` | low | Pre-existing in `rankFits` and the analysis validator; deferred. |
| `rankAt` holds a product whose own scene ad differs from the list top | false | AD-17 allows it: the pause uses `resolvePause`, which never reads `held`; covered by the "never changes resolvePause" test. |
| "an" rule misfires on a label starting with a silent or consonant-sounding vowel | false | Checked all 67 labels in `config/scene-types.json`; vowel-initial ones (office, airport or plane, eating, action) take "an". |
| NaN or out-of-clip `tMs` in `rankAt` | false | `sceneAt` returns null and `rankAt` returns an empty list with `held` null; tested. |

## Design Notes

AD-17 says the hold lasts "while the scene ID is unchanged". A scene's list is fixed, so a hold only matters across a scene change; this spec reads it as: the held top survives a scene change only within `holdMs`, with the same outcome, no worse safe tag, and the product still ranked in the new scene. "Category flag turning on" maps to the panel safe tag getting worse, since `decisions` carries no per-category flags. `holdMs` moves into `decisions` because AD-14 forbids `rankAt` reading thresholds.

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 -r test` -- all pass
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint` -- clean
- `npx -y pnpm@12.23.0 decide --check` -- no drift
