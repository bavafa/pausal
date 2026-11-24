# Epic 1 Context: Pause a sample clip and get an honest answer

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A viewer opens the site, picks a sample clip, pauses, and sees either a simulated ad or the frozen frame with one calm policy reason. The epic builds the whole decision path end to end before any model runs: the workspace scaffold, the artifact schemas, the pure policy package that is the only decision authority, the `decide` command on a hand-authored analysis fixture, and the clip picker, watch screen and pause view. It is deployed to GitHub Pages and guarded by CI from the first story, so every later epic lands in a checked, deployed project and real analysis (Epic 4) only has to replace the fixture.

## Stories

- Story 1.1: Workspace scaffold deployed to GitHub Pages
- Story 1.2: Artifact and config schemas that fail closed
- Story 1.3: Policy rules, reason order and simulated money
- Story 1.4: Scene lookup and pause resolution
- Story 1.5: Decide command on a hand-authored fixture
- Story 1.6: Clip picker in the Soft Calm style
- Story 1.7: Watch screen with the player
- Story 1.8: Pause view: ad card or pause note

## Requirements & Constraints

- An ad shows on pause only when every rule passes: R1 safe verdict at or above the safety confidence threshold; R2 no sensitive category flagged; R3 top product relevance at or above 60; R3b judge fit probability and text-embedding similarity both clear their cutoffs; R4 top product has an active campaign; R5 both judges (Jev and Qwen) say safe; R6 analysis finished without error and data is valid. R1 to R6 and R3b are the only rule ids used anywhere.
- Otherwise exactly one reason, in this order: Analysis unavailable (R6 or invalid data, always checked first), Sensitive scene (R1, R2, R5), Nothing fits well (R3, R3b), No active campaign (R4).
- Fail closed: missing, null, low-confidence, errored, pending or unanalyzed data means no ad. An absent field fails its rule, never defaults to zero or true.
- Pause view renders in under 500 ms from data already in memory; playback and pause never wait on analysis or the network.
- Products without a campaign can rank but never get the pause ad.
- Price rises with campaign bid and relevance; split 70/30 platform and publisher. Every price, split, campaign, click and the zero of a no-ad pause is labeled simulated.
- Dialogue or on-screen text can never alone unlock an ad; one prompt-injection fixture scene must resolve to no ad.
- Accessibility floor is WCAG 2.2 AA; responsive on laptop and phone; light and dark mode follow the system setting.
- Docs use no em dashes and no contractions.

## Technical Decisions

**Stack (confirmed with `npm view` at scaffold on 2026-11-23; use these exact versions):**

| Name | Version |
|---|---|
| Node | 26 LTS, 26.13.1 |
| pnpm | 12.23.0 |
| TypeScript | 7.0.2 |
| Vite with `@vitejs/plugin-react` | 8.3.8 with 6.3.0 |
| React | 19.3.1 |
| Tailwind CSS with `@tailwindcss/vite` | 4.3.5 |
| `@types/react` and `@types/react-dom` | 19.3.0 |
| `@types/node` | 26.6.6 |
| Vitest | 5.1.1 |
| oxlint (import lint) | 1.95.0 |
| secretlint with `@secretlint/secretlint-rule-preset-recommend` | 14.1.0 with 13.1.0 |

No UI component library. Pipeline-only items (ffmpeg 9.1, Jev SDK `@typesafe-ai/sdk` 0.7.0, Qwen models) are not needed in this epic.

**Workspace layout:** pnpm workspace with `packages/bundle-schema` (types and validators only, no logic), `packages/policy` (pure rules, no I/O), `packages/pipeline` (stages plus CLI: analyze, decide, eval), `apps/web` (Vite React SPA). Directories `config/`, `data/manifest`, `data/analysis`, `data/decisions`, `data/products`, `data/labels`, `docs/eval` must exist. Packages and directories in kebab-case, types in PascalCase, artifacts named `<clip-id>.json`.

**Import boundaries (enforced by a lint rule on package imports; lint fails naming the forbidden import):**
- `apps/web` may import `policy` and `bundle-schema` only.
- `packages/pipeline` may import `policy` and `bundle-schema` only.
- `packages/policy` may import `bundle-schema` only, and no model client, file system, network or browser API.
- `web` and `pipeline` never import each other.

**CI (GitHub Actions, on push to `main`):** type-check, import lint, tests, secret scan, regenerate `decisions` and fail on any diff, fail on a referenced product ID with no product file or an orphan product file, deploy `apps/web` to GitHub Pages. No model call and no secrets in CI. `.env` is gitignored; a secret scan also runs as a pre-commit hook. Rollback is redeploying the previous commit.

**Artifacts:**
- `analysis/<clip>.json`: model outputs only; the web never reads it. In this epic it is a hand-authored fixture.
- `decisions/<clip>.json`: derived by `policy` from `analysis`, `config/thresholds.json` and `config/campaigns.json`. Byte-for-byte reproducible: sorted keys, no timestamps, integers only, with `analysisHash`, `thresholdsHash`, `campaignsHash`. Per scene: outcome (`ad` or a reason), top product, price and split, ranked list, and `panel` (`contextLabel` primary and optional secondary, `moodLabel`, `sentiment`, `safeTag`). Never a free-text description or judge reasons. Tagline only for `ad` outcomes.
- `data/manifest/<clip-id>.json`: hand-authored title, video URL, duration, "AI-generated" label, dialogue flag, attribution key. The video URL lives only here.
- `data/products/<product-id>.json`: only for products referenced by `decisions`.

**Schema invariants (`bundle-schema`, validated at load):**
- Scenes sorted by `startMs`, half-open `[startMs, endMs)`, tiling `[0, durationMs)` with no gap or overlap.
- Judgments are a total record: `judgments: { jev, qwen }`, each with `status` (`ok` or `error`), `verdict` (safe, caution, unsafe), `confidence`, and `categories` with all six keys (violence, deathOrGrief, sexual, medicalTrauma, childFocused, intenseDialogue), each `{ flagged, p }`. A missing key, null `p` or `status: error` marks the scene invalid.
- Threshold floors: safety confidence at least 0.8, relevance at least 60, both R3b cutoffs present, every category cutoff at most 0.5, `holdMs` at least 5000. Failures name the field.
- IDs and units: clip ID is the video hash prefix, scene ID is `s` plus 7-digit zero-padded `startMs`, product ID is the catalog ID, all times integer milliseconds, money integer cents.

**Policy package:**
- Exports `resolvePause`, `rankAt`, `sceneAt`, formatters, `checkTagline`, the reason enum, the sentiment table, price and split. Thresholds and campaigns are inputs, never constants.
- Recomputes `flagged` from `p` and the cutoff, never trusts the boolean; a category is flagged if either judge flags it; confidence is the minimum of both judges; caution blocks.
- Relevance is rounded half up to an integer before the 60 comparison.
- Top product is rank 1 (relevance descending, ties by lower product ID). The ad is for that product only. Campaign active by `active: true` only; `budget` is never decremented. No campaign on the top product gives No active campaign even if a lower product has one.
- Split gives the publisher share rounded down, remainder to the platform. Simulated values carry `simulated: true`; no simulated number is a bare `number` in web code.
- Sentiment table maps 5 levels to -1, -0.5, 0, 0.5, 1 with mood labels.
- `checkTagline(tagline, product)` rejects claims not in the product data; fallback is the product name.
- `sceneAt(decisions, tMs)` returns the containing scene, none outside the clip. `resolvePause(decisions, tMs, session)` returns an ad only if the scene at `tMs` and every scene ending within 1000 ms before it resolve to an ad for the same product; otherwise the first reason in order. Outside every scene, or in a pending or invalid scene, it returns Analysis unavailable.
- The web calls only `resolvePause`, `rankAt` and the formatters; it never evaluates rules or searches scenes itself.

**Web runtime:** after the manifest, `decisions`, video and static assets load, no further network request. Fonts self-hosted. Current list images preloaded. Pause time is the displayed-frame time from `requestVideoFrameCallback` when available, else `currentTime`. Model-derived text renders as text, never HTML. No analytics. Web state is only the paused flag, playback time, the session pause log and the display-only held top.

**Required tests in this epic:** one per policy rule and for reason order; schema rejections of gaps, overlaps, missing categories and out-of-range thresholds, plus a passing and failing case per schema; `resolvePause` boundaries at minus 1 ms, 0 ms and plus 1000 ms; one prompt-injection fixture.

## UX & Interaction Patterns

- Soft Calm tokens as CSS variables consumed by Tailwind v4: background, foreground, card, muted, muted-foreground, border, accent, accent-foreground, frozen-scrim, in light and dark; radii 8, 14 and full; 4-based spacing; gutters 12 and 18 px.
- Typography: Lora for product names and ad titles (20 px, 15 px small), Raleway for body 14, label 12, eyebrow 11 uppercase at 0.08em. Self-hosted with Georgia and system-ui fallbacks.
- Clip picker: each clip with title and an "AI-generated" label, one line explaining the experiment, nothing competing for attention.
- Watch screen: video at 16:9 full content width that never resizes; native controls; tap, click or Space toggles play; no autoplay of a next clip; Back to clips link. Invalid `decisions` shows "Analysis unavailable for this scene." and every pause shows no ad.
- Frozen frame: `saturate(.35) brightness(.7)` with scrim; one soft shadow on the overlay card; overlay closes at once on play, Space or Escape; never an overlay during playback.
- Ad card, laptop: centered at about 78 percent width, image left 38 percent, "Sponsored", "Simulated ad", Lora title, tagline, View product button (no-op until Epic 3), QR placeholder, "Shown because" line.
- Ad card, phone (under 768 px, and in-between widths until the laptop row fits): covers most of the frame with 8 px inset, playback bar visible, image left 40 percent; tagline, QR and "Shown because" hidden. The in-between breakpoint is unconfirmed and settled in build.
- Pause note: small centered card, "Paused" plus one reason line in policy wording, for example "No ad here: sensitive scene."; never names sensitive details; no red or alarm colors.
- Accessibility: polite live region announces the overlay text without moving focus; Tab reaches View product; 44 px targets; reduced motion removes fades; 4.5:1 text contrast in both modes.
- Voice: calm, one line, never apologizes or sells; every figure says "Simulated"; accent used only for the one action, the safe tag and playback progress.

## Cross-Story Dependencies

- 1.1 comes first; every other story lands in its workspace and CI.
- 1.2 schemas feed 1.3 policy, 1.4 resolution and 1.5 decide; 1.3 rules feed 1.4 and 1.5.
- 1.5 produces the fixture `decisions`, manifest and product files the web stories 1.7 and 1.8 read; 1.6 tokens and fonts are used by 1.7 and 1.8.
- Epic 2 builds the ranked list, `rankAt` hold and scene panel on these artifacts. Epic 3 wires View product, the QR and the earnings display to the simulated values typed here. Epic 4 replaces the fixture with real `analysis` and owns tagline generation. Epic 5 adds the eval guardrail to CI and the browser test for no network after load and pause under 500 ms.
