# Epic 2 Context: Follow the scene as it plays

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

While a clip plays, the viewer sees a slim live scene panel (what the system thinks of the current scene) and a ranked list of up to 10 sponsored products with a stable, highlighted top product, a reason line and a relevance score for each. The list must feel calm (no flicker) and must never imply an ad where the pause would show none. Everything is still built on the hand-authored fixture clip from Epic 1; the real pipeline arrives in Epic 4.

## Stories

- Story 2.1: Ranked list, reason lines and the ranking window
- Story 2.2: Live scene panel
- Story 2.3: Product list with a highlighted top product

## Requirements & Constraints

- Up to 10 products per scene, each with an integer relevance 0 to 100 and a one-line reason. Only products that rank are shown; no filler.
- Ranking uses the current scene plus the previous 3 scenes (fit stage aggregation, ranking only; safety never sees earlier scenes).
- Stable list: the top product changes at most once every 5 seconds (`holdMs`, 5000, in config) unless the scene verdict changes.
- Reason lines are templates filled from matched product attributes and the scene-type label. No model call, no scene detail.
- The scene panel never renders a free-text scene description or judge reasons.
- No network request after load; product images for the current list are preloaded so the pause view renders from memory.
- Model-derived text renders as text, never HTML.

## Technical Decisions

- `decisions/<clip>.json` is derived by `policy` from `analysis` and config with no model call, is canonical (sorted keys, integer money and time) and is regenerated and diffed in CI (`pnpm decide --check`). Per scene it carries the outcome, the top product, price and split, the ranked list and `panel`.
- The web reads the manifest, `decisions` and product files only, and calls only `resolvePause(decisions, tMs)`, `sceneAt`, `rankAt(decisions, tMs, held)` and `policy` formatters. It never evaluates rules or reads thresholds.
- Top product is rank 1 of the full ranked list: relevance descending, ties by lower product ID. The pause ad is for that product only.
- Ranking window: `rankAt` returns the scene's ranked list; the web may keep the previously held top only while the scene ID is unchanged and for at most `holdMs`. A change of outcome between scenes, or any category flag turning on, releases the hold at once. The window shapes the list only; `resolvePause` never reads the held product.
- `panel` per scene: `contextLabel` (primary and optional secondary from the fixed scene-type list), `moodLabel`, `sentiment`, `safeTag` (safe, caution, unsafe).
- Web state is only: paused flag, playback time, session pause log and the display-only held top.
- Tests: `rankAt` hold, expiry at `holdMs`, release on outcome change and release on a flag.

## UX & Interaction Patterns

- Watch screen order, laptop: video at 16:9 full content width (never resizes), scene panel as a slim strip, top product (150 px thumb plus text), then up to 9 small products in one row.
- Phone (under 768 px) and in-between widths: same order, top thumb 96 px, small products scroll sideways as 84 px items with 44 px touch targets.
- Scene panel: eyebrow keys "Scene" and "Sentiment", context label, mood label, brand-safe tag as an accent outline pill, and "Based on this scene and the previous 3". Analysis failed or unavailable: "Analysis unavailable for this scene." Updates are not announced by a live region; values are readable on demand.
- Top product: eyebrow "Sponsored", Lora title, reason line, relevance score in muted `label`. Small product: square thumb plus name in `label`. Every thumbnail has alt text with the product name.
- Eyebrow style (uppercase, tracked) only for "Sponsored", "Simulated ad" and the panel keys.

## Cross-Story Dependencies

- 2.1 extends `decide` and the `decisions` schema (ranked list with reasons) and adds `rankAt` to `policy`; 2.2 and 2.3 consume them.
- 2.3 uses `rankAt` output and preloads images used by the Epic 1 pause view.
- Epic 3 product page opens from the list and the ad card; Epic 4 replaces the fixture `analysis` with real fit scores.
