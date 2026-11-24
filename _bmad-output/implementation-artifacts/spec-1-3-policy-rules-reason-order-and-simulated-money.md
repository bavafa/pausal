---
title: 'Policy rules, reason order and simulated money'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: '9b31d8c6e33f5ea52bb9bcc8e3992938113eec15'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/docs/policy/ad-suppression-policy.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `packages/policy` exports only a version constant, so nothing decides ad or no ad, picks the reason, or prices an ad.

**Approach:** Pure functions in `policy`: `evaluateScene(scene, thresholds, campaigns)` runs R1 to R6 and R3b on one validated analysis scene and returns the outcome, failed rule ids, ranked list, top product, simulated price and split; plus the sentiment table, `checkTagline`, the zero earning and the reason enum re-exported from `bundle-schema`.

## Boundaries & Constraints

**Always:** Inputs are the validated `bundle-schema` types; thresholds and campaigns are arguments, never constants (AD-3). Fail closed (AD-4): scene `status` not `ok`, non-empty `invalid`, `judgments: null` or any absent content field fails R6. Rule definitions:
- R1: Jev verdict `safe` and the minimum of both judges' confidence at or above `safetyConfidence`.
- R2: no category flagged; a category is flagged when either judge's `p` is at or above its cutoff (the stored `flagged` boolean is ignored, AD-15).
- R3: top product relevance, rounded half up to an integer, at or above `relevance`. No fits fails R3.
- R3b: top product `jevFitP` and `embeddingSim` each at or above their `r3b` cutoff.
- R4: a campaign for the top product with `active: true` (AD-18). A lower product's campaign never counts.
- R5: both judges' verdict `safe`; caution blocks.
- R6: as above.
Ranking: relevance (rounded) descending, ties by lower product ID; top is rank 1 (AD-18). Reason order: `analysisUnavailable` (R6) first and alone, then `sensitiveScene` (R1, R2, R5), `nothingFits` (R3, R3b), `noActiveCampaign` (R4). All rules are still evaluated and every failed id is returned. Split: publisher gets 30 percent rounded down, platform the remainder. Price, split and the zero earning carry `simulated: true` (AD-8). Integer cents only. Docs: no em dashes, no contractions.

**Decisions:** Price is `priceCents = round_half_up(bidCents * ((1 - w) + w * relevance / 100))` with the rounded relevance and `w = pricing.relevanceWeight` (0..1, start 0.5) as a new required field in `config/thresholds.json`, so `thresholdsHash` covers it and the `decisions` schema is unchanged. Mood labels by sentiment level 1 to 5: Tense, Somber, Neutral, Relaxed, Joyful (sentiment -1, -0.5, 0, 0.5, 1).

**Never:** No scene lookup, `resolvePause`, `rankAt` or hold logic (Story 1.4). No `decisions` building, hashing, panel assembly or fixtures (Story 1.5). No UI formatters (Stories 1.8 and Epic 3). No I/O, no new dependency. No change to `apps/web` or `pipeline`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| All pass | both safe, conf 0.9, all `p` 0.1, top relevance 72.5, fit cutoffs cleared, active campaign | `outcome: "ad"`, `failed: []`, price and split simulated, split 70/30 | N/A |
| Each rule alone | one rule broken per case (R1 conf 0.79; R2 qwen `p` at cutoff with `flagged: false`; R3 relevance 59.4; R3b fit 0.01; R4 inactive; R5 qwen caution; R6 `status: pending`) | mapped reason, `failed` is exactly that id | N/A |
| Rounding | relevance 59.5 | rounds to 60, R3 passes | N/A |
| Order | R6 plus R2 plus R4 failing; R3 plus R4 failing | `analysisUnavailable`; `nothingFits` | N/A |
| Campaign on lower product | rank 2 active, rank 1 none | `noActiveCampaign` | N/A |
| Tie | two products at relevance 70 | lower product ID ranks first | N/A |
| Tagline | claim word or number not in product data | `checkTagline` returns false; fallback is product name | N/A |

</frozen-after-approval>

## Code Map

- `packages/policy/src/index.ts` -- keep `POLICY_SCHEMA_VERSION`; re-export the new modules.
- `packages/bundle-schema/src/decisions.ts` -- `REASONS`, `Reason`, `Outcome`, `SENTIMENTS`, `SimulatedPrice`, `SimulatedSplit`, `Ranked`: reuse, do not redefine.
- `packages/bundle-schema/src/analysis.ts` -- `AnalysisScene`, `Judgment`, `Fit`, `SentimentLevel`, `Verdict`.
- `packages/bundle-schema/src/config.ts` -- `Thresholds`, `Campaign`, `CATEGORIES`; `validateThresholds` gains `pricing.relevanceWeight` (0..1).
- `packages/bundle-schema/src/check.ts` -- `Int` brand; cast computed integers with `as Int`.
- `packages/bundle-schema/src/schemas.test.ts` -- valid thresholds fixture needs the new pricing field.
- `.oxlintrc.json` -- policy override forbids every bare import except bundle-schema, so `vitest` in policy tests needs a test-file override like the bundle-schema one.
- `tsconfig.base.json` -- no enums (`erasableSyntaxOnly`); use `as const` arrays.

## Tasks & Acceptance

**Execution:**
- [x] `packages/bundle-schema/src/config.ts` and `schemas.test.ts` -- add `pricing.relevanceWeight` with a failing-range test.
- [x] `packages/policy/src/rules.ts` -- `RULE_IDS`, `roundHalfUp`, `rankFits`, `evaluateScene` returning `{ outcome, failed, ranked, topProductId, price, split }`.
- [x] `packages/policy/src/money.ts` -- `priceFor(bidCents, relevance, thresholds)`, `splitPrice(price)`, `ZERO_EARNING`.
- [x] `packages/policy/src/sentiment.ts` -- `SENTIMENT_TABLE` level to `{ sentiment, moodLabel }`.
- [x] `packages/policy/src/tagline.ts` -- `checkTagline(tagline, product)` and `taglineOrName`.
- [x] `packages/policy/src/index.ts` -- re-export the above plus `REASONS` and `Reason`.
- [x] `.oxlintrc.json` -- allow `vitest` in `packages/policy/src/**/*.test.ts`.
- [x] `packages/policy/src/*.test.ts` -- every matrix row, one test per rule, price monotonic in bid and relevance, split rounding, sentiment table, one prompt-injection case (a scene whose description and tagline try to force an ad but whose judgments say unsafe resolves to `sensitiveScene`).

**Acceptance Criteria:**
- Given `pnpm typecheck && pnpm lint && pnpm test`, when run, then all pass with the new tests.
- Given `packages/policy/src`, when linted, then it imports only `@pausal/bundle-schema` and relative files.

## Design Notes

`checkTagline` is deterministic: lowercase word tokens; every number, currency or percent token and every claim word (best, cheapest, healthy, safe, safest, guaranteed, proven, cure, organic, free, number one) in the tagline must appear in the product name, description or key features, and the tagline must be at most 120 characters; otherwise false. The pipeline's own `taglineCheck` is advisory; this check decides.

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test` -- expected: exit 0

## Implementation Notes

- `config/thresholds.json` does not exist yet, so only the schema and its test fixture gained `pricing.relevanceWeight`; Story 1.5 must include it when it writes the file.
- `evaluateScene` returns `price` and `split` only when the outcome is `ad`, otherwise null, matching the `decisions` schema. `ranked` and `topProductId` are returned for every outcome.
- When `judgments` is null, R1, R2 and R5 also fail; when `fits` is absent or empty, R3, R3b and R4 also fail. The reason is still `analysisUnavailable` whenever R6 fails.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | blind, edge | `priceFor` rounds exact .5 prices down through float error | medium | Confirmed: w 0.3, bid 20, relevance 25 gives 15.499999999999998 and 15 instead of 16; tests use only w 0.5 | patch |
| 2 | blind | `money.ts` duplicates the half-up rounding of `roundHalfUp` | low | Two copies share the float defect of #1; same fix | patch |
| 3 | edge | `roundHalfUp(0.49999999999999994)` gives 1 | low | Real float quirk; raw relevance that close to .5 does not occur in practice and the fix adds branches | reject |
| 4 | edge | Duplicate `productId` in fits | low | Schema does not reject it, but pipeline writes one fit per product; fix adds a guard | reject |
| 5 | edge | Active campaign with `bidCents: 0` gives a zero-price ad | low | Same as Story 1.2 row 15: hand-authored config, unlikely | reject |
| 6 | edge | Inflected claim words (safer, healthier, guarantee, bestselling) pass `checkTagline` | medium | Exact-word match against the list; policy forbids unsupported health, safety and quality claims; prefix match is a one-line change | patch |
| 7 | edge, blind | A claim word inside a compound or other sense in the source ("PFOA-free", "oven safe") approves it anywhere | low | Real limit of a word-level heuristic; a semantic check is beyond a deterministic rule; revisit when real taglines exist in Epic 4 | reject |
| 8 | edge | Non-ASCII words and other currency symbols skip the check | low | Product data and taglines are English; unlikely | reject |
| 9 | blind | Numbers matched without units; "#1" passes if "1" is in the source | low | Real heuristic limit; unlikely with catalog data; fix adds context parsing | reject |
| 10 | blind | No boundary tests for R1 at 0.8 and R3b at exact cutoffs | medium | Changing `>=` to `>` in R1 or R3b passes every test | patch |
| 11 | blind | Money tests miss w 0 and w 1 edges and use relevance past 100 | low | Test-only, direct correction; also covers #1 | patch |
| 12 | blind | Policy test lint override allows `@pausal/bundle-schema/**` | false | Same allowance as the main policy override (AD-23 permits bundle-schema) | reject |
| 13 | blind | `RULE_IDS` comment says "evaluation order" | low | Outcome order comes from `REASONS`; `failed` is in id order; comment correction | patch |
| 14 | blind | `SENTIMENT_TABLE` not frozen at runtime | low | Typed Readonly; no caller mutates it | reject |
| 15 | blind, gap | Prompt-injection test cannot fail for the reason it names | medium | Both verdicts unsafe decide the outcome regardless of text | patch |
| 16 | gap | `sensitiveScene` precedence over `nothingFits` and `noActiveCampaign` untested | medium | Reordering `REASONS` passes every test (pre-verified) | patch |
| 17 | gap | R1 minimum confidence tested only on the qwen side | medium | Replacing `Math.min` with qwen confidence passes every test (pre-verified) | patch |
| 18 | gap | R3b `jevFitP` clause never exercised | medium | Deleting it passes every test (pre-verified) | patch |
| 19 | gap, edge | New policy test lint override has no probe; `./../` path escape unconfirmed | medium | `tests/import-rules.test.ts` probes only bundle-schema test files (pre-verified) | patch |
