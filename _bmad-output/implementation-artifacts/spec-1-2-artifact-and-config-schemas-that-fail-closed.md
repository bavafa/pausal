---
title: 'Artifact and config schemas that fail closed'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '5d6575ca03ba2702067713e80755f32d5fd3580f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `bundle-schema` exports only a version constant, so nothing stops a half-valid artifact or a lax threshold file from reaching `policy`.

**Approach:** Types plus hand-written validators in `bundle-schema` for manifest, analysis, decisions, product, thresholds, campaigns and the scene-type list. Each validator returns a typed value or a list of issues naming the field path; judgment defects mark a single analysis scene invalid instead of failing the file.

## Boundaries & Constraints

**Always:** Fail closed: an absent, null, non-integer or out-of-range field is an issue, never a default. Times are integer ms, money integer cents, scene ID is `s` plus 7-digit zero-padded `startMs` and must match it. Scenes sorted, half-open, tiling `[0, durationMs)` (AD-16) in analysis and decisions. Judgments are a total record (AD-15). Threshold floors per AD-20. `decisions` scenes carry `panel` and never a description or judge reasons; `tagline` only when outcome is `ad`; simulated money carries `simulated: true`. The reason values (`analysisUnavailable`, `sensitiveScene`, `nothingFits`, `noActiveCampaign`) are defined here so `decisions` can be validated; `policy` re-exports them in 1.3. No runtime dependency is added (AD-23: schema imports nothing). Docs: no em dashes, no contractions.

**Decisions:** Scene type uses a fixed list in `config/scene-types.json` (Jev Choice allows up to 255 options) so judging, evaluation joins, the panel and reason templates stay exact; `analysis` also stores the VLM free-text label (`sceneType.freeLabel`, optional) so the list can grow after the first run. Starter list, about 60 labels: kitchen, dining room, living room, bedroom, bathroom, home office, garage, backyard, garden, office, classroom, library, hospital, store, restaurant, cafe, bar or nightclub, hotel, gym, workshop, factory, farm, construction site, city street, suburb, countryside, forest, mountains, beach, lake or river, desert, snow, park, campsite, car interior, road trip, train or station, airport or plane, boat, cooking, eating, sports, fitness, shopping, travel, party, wedding or celebration, concert, gaming, reading, working, studying, crafting, gardening, relaxing, conversation, romance, action, chase, fight or conflict, crime, war, horror, science fiction, fantasy, historical, comedy. The spec runs at about 2,000 tokens by user choice.

**Never:** No rule evaluation, ranking, pricing or hashing logic (Stories 1.3 to 1.5). No fixture analysis, decisions, manifest or product files (Story 1.5). No file reading: validators take parsed JSON (`unknown`). No changes to `apps/web` or `pipeline`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid file | each schema's minimal valid example | `{ ok: true, value }` | N/A |
| Timeline gap / overlap / unsorted / short | scenes `[0,1000),[1500,...)`, overlaps, swapped order, last `endMs` below `durationMs` | `ok: false` | issue names `scenes[i]` |
| Bad judgment | missing `intenseDialogue`, `p: null`, or `status: "error"` on jev or qwen | file `ok: true`; that scene has `invalid` non-empty and `judgments: null` | other scenes unaffected |
| Lax thresholds | `safetyConfidence: 0.79`, `relevance: 59`, no `r3b.embeddingSim`, a category cutoff 0.51, `holdMs: 4999` | `ok: false` | issue path names the field |
| Bad units or IDs | `startMs: 1.5`, `id: "s12"`, `bidCents: 9.99` | `ok: false` | issue names the field |
| Leaky decisions | scene with `description`, or `tagline` on a no-ad outcome | `ok: false` | issue names the field |

</frozen-after-approval>

## Code Map

- `packages/bundle-schema/src/index.ts` -- keeps `SCHEMA_VERSION` (bump to 1); re-exports everything new. `policy` and `pipeline` import `SCHEMA_VERSION` from it.
- `packages/bundle-schema/package.json` -- `exports` maps `.` to `./src/index.ts`; no dependencies, keep it that way.
- `.oxlintrc.json` -- bundle-schema override forbids importing other packages; relative imports inside the package are allowed.
- `tsconfig.base.json` -- `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `erasableSyntaxOnly` (no enums: use `as const` arrays plus union types).
- Vitest has no config; root `pnpm test` picks up any `*.test.ts`, so colocate tests in `packages/bundle-schema/src/`.
- Spine sources for field lists: AD-2, AD-7, AD-10, AD-15, AD-16, AD-18, AD-19, AD-20 in `ARCHITECTURE-SPINE.md`.

## Tasks & Acceptance

**Execution:**
- [x] `packages/bundle-schema/src/check.ts` -- `Issue { path, message }`, `Result<T>`, small guards (object, integer, nonNegInt, prob 0..1, cosine -1..1, oneOf, nonEmptyString, array) that push issues -- one helper set, no dependency.
- [x] `packages/bundle-schema/src/timeline.ts` -- `checkTimeline(scenes, durationMs)` and `sceneId(startMs)` -- shared by analysis and decisions (AD-10, AD-16).
- [x] `packages/bundle-schema/src/manifest.ts` -- `clipId`, `title`, `videoUrl`, `durationMs`, `aiGenerated: true`, `hasDialogue`, `attributionKey` (AD-19).
- [x] `packages/bundle-schema/src/analysis.ts` -- top level `clipId`, `durationMs`, `models` (pinned names); scene `id`, `startMs`, `endMs`, `chunk`, `status` (`ok`, `pending`, `error`), optional typed `error`, `description`, `sceneType { primary, secondary?, freeLabel? }` (primary and secondary validated against the scene-type list passed in), `sentimentLevel` 1..5, `judgments { jev, qwen }`, `fits[] { productId, jevFitP, embeddingSim, relevance 0..100 }`, optional `tagline` with `taglineCheck`. Judgment defects set scene `invalid: string[]` and `judgments: null` (AD-15, AD-22).
- [x] `packages/bundle-schema/src/decisions.ts` -- `clipId`, `durationMs`, `analysisHash`, `thresholdsHash`, `campaignsHash`; scene `id`, `startMs`, `endMs`, `outcome` (`ad` or a reason), `topProductId | null`, `price { cents, simulated: true } | null`, `split { platformCents, publisherCents, simulated: true } | null`, `ranked[] { productId, relevance }`, `panel { contextLabel { primary, secondary? }, moodLabel, sentiment (-1,-0.5,0,0.5,1), safeTag }`, `tagline` only for `ad`; unknown keys rejected (AD-2, AD-14).
- [x] `packages/bundle-schema/src/product.ts` -- `id`, `name`, `imagePath`, `description`, `keyFeatures[]`, `attribution` (AD-19).
- [x] `packages/bundle-schema/src/config.ts` -- thresholds `{ safetyConfidence >= 0.8, relevance >= 60, r3b { jevFitP, embeddingSim }, categoryCutoffs (six keys, each <= 0.5), holdMs >= 5000, taglineGateMargin }`; campaigns `[{ productId, bidCents, budgetCents, active }]` unique by product; scene types (non-empty unique strings) (AD-7, AD-18, AD-20).
- [x] `config/scene-types.json` -- the starter list from Decisions, as a JSON array of strings.
- [x] `packages/bundle-schema/src/*.test.ts` -- one passing and one failing case per schema plus every matrix row.

**Acceptance Criteria:**
- Given `pnpm typecheck && pnpm lint && pnpm test`, when run, then all pass with the new tests included.
- Given a validated analysis or decisions value, when its type is read, then `startMs`, `endMs`, cents and relevance are typed as integers by validation and no scene type in `decisions` has a `description` key.
- Given `config/scene-types.json`, when validated, then it passes.

## Design Notes

Validators collect all issues instead of stopping at the first, so one run of `decide` later reports every bad field. Analysis is the one schema with two levels of failure: structure (timeline, IDs, units) fails the file, judgment content fails only its scene, because AD-15 says that scene resolves to "analysis unavailable" while the rest of the clip still works.

```ts
const r = validateThresholds(json);
if (!r.ok) throw new Error(r.issues.map(i => `${i.path}: ${i.message}`).join("\n"));
```

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test` -- expected: exit 0

## Implementation Notes

- Integer fields are typed `Int` (a branded `number`) so `startMs`, `endMs`, cents and relevance read as integers after validation.
- Analysis content fields (`description`, `sceneType`, `sentimentLevel`, `fits`) are required when `status` is `ok` and optional otherwise, so a pending or errored scene can omit them. Their defects fail the file; only judgment defects mark the scene `invalid` with `judgments: null`. Every validated analysis scene carries `invalid` (empty when fine).
- Decisions with outcome `ad` require non-null `topProductId`, `price` and `split`.
- `config/scene-types.json` holds 67 labels; the validator allows 1 to 255 unique labels.
- `.oxlintrc.json` gains an override so `packages/bundle-schema/src/**/*.test.ts` may import `vitest` (and repo-relative files such as `config/scene-types.json`); source files stay import-free.
- Clip IDs are validated as lowercase hex (hash prefix, AD-10); model names ending in `latest` are rejected (AD-22).

- Orchestrator check: `analysis` `fits[].relevance` accepts a fraction from 0 to 100 (the raw score), because the spine has `policy` round it half up; `decisions` `ranked[].relevance` stays an integer. 64 tests pass.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | blind, edge | `status: error` scene needs no `error` object; `ok` scene may carry one | low | analysis.ts checkContent only validates `error` when present; AD-22 wants typed per-scene errors; direct correction | patch |
| 2 | blind, edge, gap | No-ad outcome may carry `price` and `split` | medium | `nullable` only forces non-null for `ad`; simulated money must exist only on a shown ad | patch |
| 3 | blind, edge, gap | Same claim for `topProductId` on no-ad outcomes | false | AD-17: `rankAt` shows the scene's top product in the list on every scene, so a no-ad scene legitimately has one | reject |
| 4 | blind, edge | `split` not checked to sum to `price.cents` | low | No sum check in decisions.ts; one-line invariant | patch |
| 5 | blind, edge | `topProductId` not tied to `ranked[0]` | low | AD-18 top product is rank 1; one-line check when non-null | patch |
| 6 | blind | `r3b` and `taglineGateMargin` have no floor | false | AD-20 requires only that both R3b cutoffs are present; no floor is defined in the spine or policy | reject |
| 7 | blind | Unknown keys accepted outside decisions | low | Required fields still fail when misspelled; only optional typos slip; fix adds checks to five validators | reject |
| 8 | blind | Judgments carry no `reasons` | low | AD-15 defines J without reasons; nothing consumes them until Epic 4 | reject |
| 9 | blind, edge, gap | Decisions `contextLabel` not checked against scene-type list | low | Decisions are derived by policy from analysis already checked against the list; fix adds a parameter | reject |
| 10 | blind, edge | Alias check catches only a `latest` suffix; trailing spaces | low | No general pinned-name pattern exists; regex heuristic | reject |
| 11 | edge | `models` lacks required roles | low | Roles are set in Epic 4 pipeline; not defined yet | reject |
| 12 | blind, edge | `clipId` accepts any hex length | low | Prefix length is not defined in AD-10; any bound would be invented | reject |
| 13 | blind | No `schemaVersion` in artifacts | low | CI regenerates decisions and diffs; hashes pin inputs | reject |
| 14 | blind | Pending scenes get `judgments: is missing` in `invalid` | low | Pending already resolves to analysis unavailable; message is accurate | reject |
| 15 | blind | Active campaign with zero bid; empty `keyFeatures` | low | Hand-authored config, unlikely; adds branches | reject |
| 16 | blind | Scene-type list mixes places, activities and genres | false | List approved by the user in the frozen Decisions; primary plus secondary covers place plus activity | reject |
| 17 | blind, edge, gap | Test-file lint override (`!../**`) untested and possibly loose | medium | `tests/import-rules.test.ts` probe is never a `.test.ts` file, so nothing checks the override | patch |
| 18 | blind | `index.ts` exports internal helpers | low | No consumer yet; pipeline may reuse guards | reject |
| 19 | blind, edge | `sceneId` exceeds 7 digits past 9,999,999 ms | low | Clips are at most 2 minutes, but the fix is a direct bound on `startMs` | patch |
| 20 | edge | Scene-type labels may differ only by case or whitespace | low | Fixed hand-written file, unlikely; adds normalization | reject |
| 21 | edge | Analysis relevance typed `number`, not integer | false | Deliberate: spine has policy round raw relevance half up; decisions relevance is integer | reject |
| 22 | gap | Nested unknown-key rejection in decisions untested | medium | Only scene-level `description` tested; removing `onlyKeys` on panel or root passes all tests | patch |
| 23 | gap | Analysis content field failures untested | medium | sentimentLevel, fits ranges, secondary, chunk, empty models never exercised failing | patch |
