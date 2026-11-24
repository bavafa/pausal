---
title: 'Story 2.3: Product list with a highlighted top product'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'a8dfc8e4cbceaa962a22a224aa6a47d9a79c4efd'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The watch screen does not show the ranked products for the playing scene (F2, FR-5, FR-6, FR-8, UX-DR4, UX-DR7).

**Approach:** Drive the list from `rankAt(decisions, tMs, held)` on every displayed frame and seek, keep `held` in a ref, re-render only when the scene or the shown order changes, and render a top product plus up to 9 small products from a pure mapping in `product-list.ts`.

## Boundaries & Constraints

**Always:**
- Order and items come only from `rankAt`; the pause view keeps using `resolvePause`.
- Top product: thumb 96 px, 150 px from the laptop breakpoint (`lg`, 1024 px); eyebrow "Sponsored"; Lora title (`title-sm`, `title` on laptop); reason line; "Relevance N" in muted `label`.
- Small products: square thumb plus name in `label`. Laptop: one row of up to 9. Phone and in-between: a sideways scroll strip of 84 px items, each at least 44 px tall; the strip is a focusable labelled region so a keyboard can scroll it.
- Every thumbnail `alt` is the product name. Fewer than 10 ranked shows only those.
- Agent decisions: no list when the scene outcome is `analysisUnavailable`, outside the clip or with null `decisions` (fail closed, matches the panel); a ranked ID with no product file is skipped; images stay preloaded by the existing effect that preloads every product in `decisions` (a superset of the current list).

**Never:** no product page or click handling (Epic 3); no scene description; no change to `rankAt` or `decide`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output |
|----------|--------------|-----------------|
| Two ranked | fixture s0000000 | top Everyday Skillet with its reason and "Relevance 80", one small Pour Kettle |
| Sensitive scene | fixture s0005000 | list still shown (only the pause is suppressed) |
| Unavailable | s0020000, outside clip, null decisions | no list |
| Unknown product ID | ranked ID missing from products | skipped |
| Held top | `rankAt` returns a held product first | that product is the top |

</frozen-after-approval>

## Code Map

- `apps/web/src/WatchScreen.tsx` -- replace the `sceneId` state from Story 2.2 with one `rank` state `{ scene, ranked }` from `rankAt`, set when `scene.id` or the ID order changes; `track` already runs on every rVFC frame, `seeked` and fallback `timeupdate`. `held` lives in a `useRef`.
- `apps/web/src/product-list.ts` (new) -- `productList(scene, ranked, products)` returns `{ top: { product, reason, relevance }, rest: Product[] } | null`.
- `apps/web/src/ProductList.tsx` (new) -- markup; reuse the eyebrow classes and `assetUrl` from `clips.ts`.
- `apps/web/src/ScenePanel.tsx` -- unchanged, fed `rank.scene`.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/src/product-list.ts` and `product-list.test.ts` -- every matrix row.
- [x] `apps/web/src/ProductList.tsx` -- markup per Boundaries.
- [x] `apps/web/src/WatchScreen.tsx` -- rank state, held ref, render under the panel.

**Acceptance Criteria:**
- Given the dev server at 375 px and at 1280 px, when the fixture plays, then the top thumb is 96 px and 150 px, the strip scrolls sideways on phone, and the top product changes in step with `rankAt`.

## Implementation Notes

- Browser check at 1280 px: top thumb 150 px, small thumbs about 101 px in a 9-column row; seeks to 0, 7.5, 12.5, 17.5, 22.5 and 34 s match `rankAt` (none at 22.5 s). At 375 px: top thumb 96 px, strip items 84 by 105 px, `overflow-x: auto`, no page overflow. No console errors.
- The fixture has no scene pair where a hold applies (each change also changes the outcome), so the hold is covered by the `rankAt` unit tests only.

## Spec Change Log

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Strip is a tab stop on laptop and when it holds one item, where it does not scroll | low | Rejected: one extra tab stop; a fix needs a resize observer for a rare cost. |
| Small item alt text repeats the visible name for screen readers | low | Rejected: the story requires alt text with the product name; Epic 3 turns items into links, where the pairing can be revisited. |
| `rankFor` mutates the held ref inside the state initializer | false | Idempotent for the same input; a StrictMode double call gives the same `held`. |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 test`, `typecheck`, `lint`, `-r build` -- all pass

**Manual checks:**
- Dev server: seek across scenes at phone and laptop widths; check sizes, alt text and no console errors.
