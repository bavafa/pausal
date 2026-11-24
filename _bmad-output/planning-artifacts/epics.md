---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-Pausall-2026-11-22/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Pausall-2026-11-22/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-Pausall-2026-11-22/EXPERIENCE.md
  - docs/policy/ad-suppression-policy.md
  - docs/adr/0001-precompute-with-pipeline-seam.md
  - docs/adr/0002-typescript-workspace-vite-spa-no-ui-library.md
  - docs/adr/0003-analysis-and-decisions-artifacts.md
  - docs/adr/0004-shared-policy-package.md
  - docs/adr/0005-judges-jev-primary-dual-safety.md
  - docs/adr/0006-github-pages-and-local-pipeline-keys.md
  - docs/adr/0007-describe-then-judge.md
  - docs/adr/0008-decisions-carry-outcome-and-timeline.md
  - docs/data-sources.md
---

# Pausall - Epic Breakdown

## Overview

This document breaks the requirements from the PRD, the UX design contract and the architecture spine into epics and stories that can be built one at a time. The architecture spine is the build contract; where this document and the spine disagree, the spine wins.

## Requirements Inventory

### Functional Requirements

FR1 (FR-1): The pipeline splits a clip of up to 5 minutes into scenes and stores a scene profile for each: description, scene type, sentiment (-1 to +1 with a mood label), brand-safety verdict (safe, caution, unsafe) with reasons and confidence.
FR2 (FR-2): Playback and pause only read results already loaded; no analysis blocks playback.
FR3 (FR-3): Brand safety is classified from the scene description, never from raw dialogue or on-screen text.
FR4 (FR-4): A missing or low-confidence verdict counts as not safe. A scene not analyzed counts as analysis unavailable.
FR5 (FR-4a): Scene type is a primary and an optional secondary label from the project's fixed list (reviewed against IAB, file not committed). The scene judge sits behind a swappable interface; the Qwen judge is the fallback when Jev errors and the comparison baseline.
FR6 (FR-5): Below the video, up to 10 products with thumbnail and name; the top product is highlighted and larger.
FR7 (FR-6): Each product has a 0 to 100 relevance score and a one-line reason.
FR8 (FR-7): Ranking uses the current scene plus the previous 3 scenes.
FR9 (FR-8): The list updates as the clip plays; the top product changes at most once every 5 seconds unless the scene verdict changes.
FR10 (FR-9): A scene panel shows the current scene context, sentiment and brand-safe tag, updating as the clip plays.
FR11 (FR-10): On pause, an ad (product image, tagline, action button) is shown only when every policy rule passes (R1 to R6 and R3b): safe verdict at confidence threshold, no category flagged, relevance at or above 60, second relevance signal agrees, active campaign, both judges say safe, analysis valid.
FR12 (FR-11): Otherwise the frozen frame shows one reason in policy order: Analysis unavailable, Sensitive scene, Nothing fits well, No active campaign.
FR13 (FR-12): The pause view appears in under 500 ms (stored lookup only).
FR14 (FR-13): Taglines are generated only for scenes that pass the safety rules, are tied to the scene, make no claim the product data does not support, and are never shown in an unsafe scene.
FR15 (FR-14): The ad's button opens a product page (image, description, key features) and records a simulated click.
FR16 (FR-15): The ad shows a QR code visibly marked as a non-functional demo.
FR17 (FR-16): A hand-made campaign set (product, bid, budget) covers part of the catalog; products without a campaign can rank but never get the pause ad.
FR18 (FR-17): Products come from an Amazon Berkeley Objects slice with attribution. Sample clips are chosen to fit the catalog and labeled "AI-generated".
FR19 (FR-18 to FR-21): Uploads. Not built in the first release; only the pipeline library seam exists (AD-13).
FR20 (FR-22): Each scene records its analysis chunk (chunk 1 is the first 20 seconds); scenes are ordered by time.
FR21 (FR-23): Each shown ad has a simulated price that rises with campaign bid and relevance; split 70/30 platform and publisher.
FR22 (FR-24): A no-ad pause earns 0 and is shown with its reason.
FR23 (FR-25): All revenue figures are labeled simulated.

### NonFunctional Requirements

NFR1: Pause view in under 500 ms; playback never waits on analysis.
NFR2: Hosting and model cost under 10 USD per month; cost per clip minute is recorded.
NFR3: Every simulated number, ad and campaign is labeled as simulated.
NFR4: Unknown, low-confidence or failed analysis means no ad (fail closed).
NFR5: Prompt injection: dialogue or on-screen text can never alone unlock an ad.
NFR6: Catalog and licence attributions are shown; the IAB taxonomy file is not committed.
NFR7: Guardrail: zero ads shown in human-labeled unsafe scenes on the evaluation set, and the guardrail fails when it would pass vacuously.
NFR8: Primary metric: human-judged top-product fit agreement, target 80 percent. Supporting: no-ad share, list stability (reorders per minute), cost per clip minute. Results are published with failures.
NFR9: Accessibility: WCAG 2.2 AA, full keyboard use, polite live region for overlays, reduced motion, 44 px touch targets, alt text.
NFR10: Responsive layout on laptop and phone, light and dark mode following the system setting.
NFR11: Docs use no em dashes and no contractions.

### Additional Requirements

From the architecture spine and ADRs. No starter template: the scaffold is a hand-built pnpm workspace (this is Epic 1 Story 1).

- Scaffold: pnpm workspace in TypeScript with `packages/bundle-schema`, `packages/policy`, `packages/pipeline`, `apps/web` (Vite React SPA, Tailwind v4, no UI library). Pin versions with `npm view` at scaffold (spine Stack table: Node 24 LTS, pnpm 12.21.0, TypeScript 7.0.2, Vite 8.3.8, React 19.3.1, Tailwind 4.3.5).
- Import rule enforced by lint: web and pipeline import policy and schema only; policy imports schema only; policy has no I/O (AD-23 and invariants).
- Directory layout: `config/`, `data/manifest`, `data/analysis`, `data/decisions`, `data/products`, `data/labels`, `docs/eval` (Structural Seed).
- `bundle-schema` validates every artifact and config at load; rejects scene gaps or overlaps, missing judgment categories, out-of-range thresholds (AD-4, AD-15, AD-16, AD-20).
- Threshold floors as schema invariants: safety confidence at least 0.8, relevance at least 60, both R3b cutoffs present, category cutoffs at most 0.5, `holdMs` at least 5000 (AD-20).
- IDs: clip ID is video hash prefix, scene ID is `s` plus 7-digit `startMs`, product ID is catalog ID; all times integer milliseconds (AD-10).
- `policy` exports `resolvePause`, `rankAt`, `sceneAt`, formatters, `checkTagline`, the reason enum, the sentiment table, price and split (integer cents, publisher share rounded down) (AD-3, AD-9, AD-14, Conventions).
- `resolvePause` checks the scene at the displayed-frame time and every scene ending within 1000 ms before it; ad only if all agree on the same product (AD-16).
- Judgment is a total record per judge with six categories `{ flagged, p }`; policy recomputes flags from `p`; a flag from either judge counts; confidence is the minimum of both; caution blocks (AD-15).
- Top product is rank 1 (relevance descending, ties by lower product ID); campaign active by flag only, budget never decremented (AD-18).
- Ranking window: hold previous top only within the same scene and at most `holdMs`; released at once on outcome change or any flag (AD-17). FR-7 context applied in the fit stage.
- Pipeline stages: ingest (ffmpeg), segment (frame change, 8 s cap, dialogue change points), describe (Qwen VLM, paraphrase only, dialogue summary), judge (Jev plus Qwen safety), retrieve (local ABO embedding index), fit (Jev), generate (taglines) (Structural Seed, AD-5, AD-21).
- Worst-case merge of safety over sampled frames and dialogue windows; an undescribable frame sets `status: error` (AD-21).
- Pipeline operations: pinned model names in metadata, per-call timeout and bounded retry, typed per-scene errors, cost cap per run, token and cost recorded per stage (AD-22).
- `decide` command: derives `decisions` from `analysis` plus `config/thresholds.json` and `config/campaigns.json`; byte-for-byte reproducible (sorted keys, no timestamps, integers) with input hashes (AD-2).
- `decisions` per scene: outcome, top product, price and split, ranked list, `panel` (labels, mood, sentiment, safe tag); never free-text description (AD-2, AD-14).
- Products: `data/products/<id>.json` written only for referenced products; CI fails on missing or orphan product files (AD-19). Catalog and embedding index built locally, not committed (AD-12).
- Hand-authored clip manifests: title, video URL, duration, "AI-generated" label, dialogue flag, attribution key (AD-19).
- Reason lines are templates from product attributes and scene-type label, no model call (AD-7). Tagline gate uses `taglineGateMargin`; stored with `taglineCheck`; product-name fallback.
- `eval` command: sweeps 0 to duration in 100 ms steps plus boundary offsets through `resolvePause`; joins human labels by time range from `data/labels/<clip>.json`; fails on empty joins, too few unsafe seconds, or a category with zero labeled scenes; writes metrics and the Jev-versus-Qwen comparison and the 1 fps check to `docs/eval/` (AD-3, AD-11).
- Hosting: GitHub Pages serves app, artifacts and small sample videos; video URL only in the manifest; keys only in gitignored `.env` on the author's machine (AD-11).
- CI (GitHub Actions): type-check, import lint, policy tests, regenerate and diff `decisions`, run eval guardrail, secret scan, deploy; no model call (AD-11, AD-23).
- Web runtime: no network request after load; self-hosted fonts; preload current list images; displayed-frame time via `requestVideoFrameCallback`; model text rendered as text only; no analytics; simulated click in session only (AD-1, AD-16, AD-23).
- Required tests: one per policy rule and reason order; schema rejections; `resolvePause` boundaries; browser test for no network after load and pause under 500 ms; one prompt-injection fixture (AD-23).
- Pre-pipeline checks (Phase 5 "Do first"): Qwen test call to pin the VLM; open the ABO licence file before copying images; read Alibaba data terms before running real (non-generated) clips.

### UX Design Requirements

UX-DR1: Design tokens as CSS variables for Tailwind v4: Soft Calm colors in light and dark (background, foreground, card, muted, muted-foreground, border, accent, accent-foreground, frozen-scrim), radii (8, 14, full), 4-based spacing, gutters 12 and 18 px. Dark mode follows the system setting.
UX-DR2: Typography: Lora for product names and ad titles (title 20 px, title-sm 15 px), Raleway for body (14), label (12), eyebrow (11, uppercase, 0.08em). Self-hosted with Georgia and system-ui fallbacks (spine AD-1 overrides DESIGN's Google Fonts note).
UX-DR3: Clip picker screen: 4 sample clips, each labeled "AI-generated", one line explaining the experiment, link to the attribution page.
UX-DR4: Watch screen layout: video at 16:9 full content width, scene panel strip, top product (150 px thumb laptop, 96 px phone), 9 small products in a row (laptop) or a sideways scroll strip with 84 px items (phone). Player never resizes.
UX-DR5: Video player: native play and pause; tap or click on the video or Space toggles; no autoplay of a next clip.
UX-DR6: Scene panel component: eyebrow keys (Scene, Sentiment), context label, mood, brand-safe tag as accent outline pill, "Based on this scene and the previous 3"; "Analysis unavailable for this scene." when failed. Not announced continuously.
UX-DR7: Product list component: top product with eyebrow "Sponsored", Lora title, reason line, relevance score in muted label; small products as square thumb plus name; only ranked items, no filler; alt text with product name.
UX-DR8: Ad card, laptop: centered over frozen frame at about 78 percent width, image left 38 percent, "Sponsored", "Simulated ad", title, tagline, View product button, QR at 35 percent opacity marked as demo, "Shown because" line.
UX-DR9: Ad card, phone (under 768 px, and in-between widths until the laptop row fits): covers most of the frame with 8 px inset, playback bar visible, image left 40 percent; tagline, QR and "Shown because" hidden.
UX-DR10: Pause note: small centered card, "Paused" plus one reason line in policy wording ("No ad here: sensitive scene."); never names sensitive details; no red or alarm colors.
UX-DR11: Frozen frame treatment: `saturate(.35) brightness(.7)` with scrim; one soft shadow on the overlay card; overlays close instantly on play; no overlay ever during playback.
UX-DR12: Product page: own screen with image, description, key features, "Simulated click recorded."; browser Back and Back link return to the paused clip in the same paused state.
UX-DR13: Session tally: one line below the player ("Simulated earnings: no pauses yet", "Simulated earnings: 2 ads shown, 1 held back (0)"); tap expands in place to a per-pause list with reason, simulated price and 70/30 split. Each pause event counts.
UX-DR14: Attribution page: Amazon.com credit, Collins et al. citation, CC BY 4.0 link, statement of changes, no-endorsement line; reachable from the clip picker.
UX-DR15: Accessibility: polite live region announces ad card or pause note text without moving focus; Tab reaches View product; Escape or Space resumes; 44 px targets including strip items; reduced motion removes fades; 4.5:1 text contrast in both modes.
UX-DR16: Voice: calm, one-line, never apologizes or sells; every figure carries "Simulated"; accent used only for the one action, the safe tag and playback progress.

### FR Coverage Map

FR1: Epic 4 - Scene segmentation and scene profile
FR2: Epic 1 - Playback and pause read loaded decisions only
FR3: Epic 4 - Safety judged from the description (describe, then judge)
FR4: Epic 1 - Fail closed to analysis unavailable
FR5: Epic 4 - Fixed scene-type list and SceneJudge interface with Qwen fallback
FR6: Epic 2 - Product list of up to 10 with larger top product
FR7: Epic 2 - Relevance score and reason line
FR8: Epic 2 (ranking window) and Epic 4 (previous 3 scenes in the fit stage)
FR9: Epic 2 - Stable top product, hold of at most 5 seconds
FR10: Epic 2 - Live scene panel
FR11: Epic 1 - Ad shown only when R1 to R6 and R3b pass
FR12: Epic 1 - One reason in policy order
FR13: Epic 1 - Pause view under 500 ms (verified again in Epic 5)
FR14: Epic 4 - Gated tagline generation; Epic 1 owns checkTagline and the product-name fallback
FR15: Epic 3 - Product page and simulated click
FR16: Epic 3 - Demo QR code
FR17: Epic 1 - Campaign config; no campaign means no ad
FR18: Epic 4 (ABO slice, product files, AI-generated clips) and Epic 3 (attribution page)
FR19: Epic 4 - Upload seam only, nothing built
FR20: Epic 4 - Chunk field and time order on scenes
FR21: Epic 1 (price and split in policy) and Epic 3 (display)
FR22: Epic 3 - Zero-earning pause with reason in the breakdown
FR23: Epic 3 - Simulated labels on every revenue figure (typed in Epic 1)
NFR7, NFR8: Epic 5 - Guardrail, metrics and published failures

## Epic List

### Epic 1: Pause a sample clip and get an honest answer
A viewer opens the site, picks a clip, pauses, and sees either an ad or the frozen frame with one policy reason. Built on a hand-authored analysis fixture, deployed to GitHub Pages and guarded by CI from the start. Includes the workspace scaffold, bundle-schema, the full policy package (R1 to R6, R3b, reason enum, sceneAt, resolvePause, price and split, checkTagline), the decide command, clip picker, watch screen, pause view, tokens and fonts.
**FRs covered:** FR2, FR4, FR11, FR12, FR13, FR17, FR21 (computation)

### Epic 2: Follow the scene as it plays
While watching, the viewer sees the live scene panel and a ranked list of up to 10 products with a stable top product, reason lines and scores.
**FRs covered:** FR6, FR7, FR8 (ranking window), FR9, FR10

### Epic 3: Explore the ad and what it earned
The viewer opens the product page, records a simulated click and returns to the paused clip, sees the demo QR code, expands the session earnings tally, and reads the attribution page.
**FRs covered:** FR15, FR16, FR18 (attribution page), FR21 (display), FR22, FR23

### Epic 4: Analyze real sample clips
The author runs the pipeline on the 4 AI-generated sample clips and replaces the fixture with real analysis: pre-checks (Qwen pin, ABO licence, Alibaba terms), catalog slice and index, product files, manifests, pipeline stages, SceneJudge with Jev and Qwen, cost cap and typed errors, upload seam.
**FRs covered:** FR1, FR3, FR5, FR8 (fit-stage context), FR14, FR18, FR19, FR20

### Epic 5: Measure whether it works
The author labels clips and runs eval: 100 ms sweep and boundary probes through resolvePause, metrics and failures to docs/eval, Jev-versus-Qwen comparison, CI guardrail that fails on vacuous passes, and the browser test for no network after load and pause under 500 ms.
**FRs covered:** NFR7, NFR8 (checks FR13 and NFR1)

## Epic 1: Pause a sample clip and get an honest answer

A viewer opens the site, picks a clip, pauses, and sees either an ad or the frozen frame with one policy reason. Built on a hand-authored analysis fixture, deployed to GitHub Pages and guarded by CI from the start.

### Story 1.1: Workspace scaffold deployed to GitHub Pages

As the author,
I want a pnpm TypeScript workspace with the four packages, import rules and a CI pipeline that deploys a placeholder page,
So that every later story lands in a checked, deployed project.

**Acceptance Criteria:**

**Given** a clean clone
**When** I run `pnpm install` and `pnpm -r build`
**Then** `packages/bundle-schema`, `packages/policy`, `packages/pipeline` and `apps/web` build with the versions confirmed by `npm view` on the scaffold day, recorded in the spine Stack table
**And** the directories `config/`, `data/manifest`, `data/analysis`, `data/decisions`, `data/products`, `data/labels` and `docs/eval` exist

**Given** a file in `apps/web` or `packages/pipeline` that imports the other, or `packages/policy` importing anything but `bundle-schema`, a file system, network or browser API
**When** lint runs
**Then** it fails naming the forbidden import

**Given** a push to `main`
**When** GitHub Actions runs
**Then** it type-checks, lints, runs tests, runs a secret scan and deploys `apps/web` to GitHub Pages, and makes no model call
**And** `.env` is gitignored and a secret scan also runs as a pre-commit hook

### Story 1.2: Artifact and config schemas that fail closed

As the author,
I want `bundle-schema` to define and validate the manifest, analysis, decisions, product, thresholds and campaigns files,
So that a half-valid artifact or a lax config can never reach a decision.

**Acceptance Criteria:**

**Given** scenes with a gap, an overlap, unsorted `startMs`, or not tiling `[0, durationMs)`
**When** validated
**Then** validation fails (AD-16)

**Given** a judgment missing any of the six category keys, a null `p`, or `status: error`
**When** validated as part of `analysis`
**Then** the scene is marked invalid so policy resolves it to analysis unavailable (AD-15)

**Given** `config/thresholds.json` with safety confidence below 0.8, relevance below 60, a missing R3b cutoff, a category cutoff above 0.5, or `holdMs` below 5000
**When** validated
**Then** validation fails naming the field (AD-20)

**Given** any artifact
**Then** times are integer milliseconds, scene IDs are `s` plus 7-digit `startMs`, money is integer cents (AD-10)
**And** the `decisions` scene type carries `panel` (context labels, mood label, sentiment, safe tag) and has no free-text description field (AD-2)
**And** each schema has a passing and a failing test

### Story 1.3: Policy rules, reason order and simulated money

As the author,
I want `packages/policy` to evaluate R1 to R6 and R3b, pick the one reason in policy order, and price and split an ad,
So that one pure package is the only decision authority.

**Acceptance Criteria:**

**Given** a scene and its top product that pass every rule
**When** policy evaluates it
**Then** the outcome is `ad` with a price that rises with bid and relevance, split 70/30 with the publisher share rounded down

**Given** each rule failing alone (R1 to R6, R3b)
**When** evaluated
**Then** the reason is the mapped enum value, with one test per rule

**Given** several rules failing, including R6 or invalid data
**When** evaluated
**Then** the reason follows the order Analysis unavailable, Sensitive scene (R1, R2, R5), Nothing fits well (R3, R3b), No active campaign (R4)

**Given** category `p` values from both judges
**Then** policy recomputes `flagged` from `p` and the cutoff, flags if either judge flags, uses the minimum confidence, and treats caution as a block; an absent field fails its rule
**And** relevance is rounded half up to an integer before comparing to the threshold
**And** a top product without an active campaign gives No active campaign even when a lower product has one (AD-18)
**And** price, split and zero earnings carry `simulated: true` (AD-8)
**And** `checkTagline(tagline, product)` rejects a tagline with claims not in the product data, falling back to the product name
**And** the sentiment table maps the 5 levels to -1, -0.5, 0, 0.5, 1 with mood labels

### Story 1.4: Scene lookup and pause resolution

As a viewer,
I want a pause to resolve against the exact frame I see,
So that an ad never comes from a neighbouring scene.

**Acceptance Criteria:**

**Given** a valid `decisions` object
**When** `sceneAt(decisions, tMs)` is called
**Then** it returns the scene whose `[startMs, endMs)` contains `tMs`, and none outside the clip

**Given** a pause time
**When** `resolvePause(decisions, tMs)` is called
**Then** it returns an ad only if the scene at `tMs` and every scene ending within 1000 ms before it resolve to an ad for the same product; otherwise it returns the first reason in policy order
**And** a time outside every scene or in a `pending` or invalid scene returns Analysis unavailable
**And** tests cover each boundary at minus 1 ms, 0 ms and plus 1000 ms

### Story 1.5: Decide command on a hand-authored fixture

As the author,
I want `pnpm decide` to derive reproducible `decisions` from an `analysis` fixture and config,
So that the web has real-shaped data before any model runs.

**Acceptance Criteria:**

**Given** a hand-authored manifest and `analysis` fixture for one placeholder clip, with scenes that produce an ad, each of the four reasons, and one prompt-injection scene whose description quotes an instruction but is judged unsafe
**And** `config/thresholds.json` and `config/campaigns.json` with a few campaigns
**When** I run `pnpm decide`
**Then** `data/decisions/<clip-id>.json` is written with sorted keys, no timestamps, integer values, and `analysisHash`, `thresholdsHash`, `campaignsHash`
**And** a second run produces byte-identical output
**And** each scene carries outcome, top product, price and split, ranked list and `panel`, with a tagline only for `ad` outcomes

**Given** a product ID referenced by `decisions` with no `data/products` file, or a product file nothing references
**When** CI runs
**Then** it fails (AD-19)

**Given** a committed `decisions` file that differs from a fresh derivation
**When** CI runs
**Then** it fails

### Story 1.6: Clip picker in the Soft Calm style

As a viewer,
I want to land on a calm page listing the sample clips,
So that I can pick one to watch.

**Acceptance Criteria:**

**Given** the site loads
**Then** the Soft Calm tokens (colors light and dark, radii, spacing, gutters) are CSS variables used by Tailwind v4, and dark mode follows the system setting (UX-DR1)
**And** Lora and Raleway are self-hosted with Georgia and system-ui fallbacks at the DESIGN sizes (UX-DR2)

**When** I open the clip picker
**Then** I see each clip from the manifests with its title and an "AI-generated" label, one line explaining the experiment, and nothing else competing for attention (UX-DR3, UX-DR16)
**And** selecting a clip opens its watch screen; text meets 4.5:1 contrast in both modes

### Story 1.7: Watch screen with the player

As a viewer,
I want the clip to play at 16:9 with native controls,
So that I can watch and pause it.

**Acceptance Criteria:**

**Given** I open a clip
**When** the watch screen loads the manifest, `decisions` and video
**Then** the video sits at full content width at 16:9 on laptop and phone and never resizes (UX-DR4)
**And** tap or click on the video, or Space on laptop, toggles play and pause; no next clip autoplays (UX-DR5)
**And** after load the page makes no further network request (AD-1)
**And** a Back to clips link returns to the picker
**And** an invalid `decisions` file shows "Analysis unavailable for this scene." and every pause shows no ad

### Story 1.8: Pause view: ad card or pause note

As a viewer,
I want pausing to show either a simulated ad or one calm reason,
So that I see what the system decided for this moment.

**Acceptance Criteria:**

**Given** the video is paused
**When** the web calls `resolvePause` with the displayed-frame time (`requestVideoFrameCallback` media time when available, else `currentTime`)
**Then** the overlay renders within 500 ms from memory over a frozen frame dimmed with `saturate(.35) brightness(.7)` (FR-12, UX-DR11)

**Given** the outcome is `ad`
**Then** on laptop the ad card is centered at about 78 percent width with image, "Sponsored", "Simulated ad", Lora title, tagline, View product button (no-op until Epic 3), QR placeholder area, and "Shown because" line (UX-DR8)
**And** on phone and in-between widths it covers most of the frame with an 8 px inset, playback bar visible, tagline, QR and "Shown because" hidden (UX-DR9)

**Given** the outcome is a reason
**Then** the pause note shows "Paused" and the policy wording, for example "No ad here: sensitive scene.", in calm colors with no red (UX-DR10)

**When** I press play, Space or Escape
**Then** the overlay closes at once, and no overlay ever appears during playback
**And** the overlay text is announced in a polite live region without moving focus; Tab reaches View product; with reduced motion there is no fade; targets are at least 44 px (UX-DR15)
**And** model-derived text renders as text, never HTML

## Epic 2: Follow the scene as it plays

While watching, the viewer sees the live scene panel and a ranked list of up to 10 products with a stable top product, reason lines and scores.

### Story 2.1: Ranked list, reason lines and the ranking window

As a viewer,
I want the product ranking to follow the scene without flickering,
So that the list feels calm and still tells the truth about the scene.

**Acceptance Criteria:**

**Given** `analysis` fit scores for a scene
**When** `decide` runs
**Then** each scene's ranked list holds at most 10 products sorted by relevance descending, ties by lower product ID, each with an integer 0 to 100 score and a one-line reason built from a template of matched product attributes and the scene-type label, with no model call and no scene detail (AD-7, AD-18)
**And** products that do not rank are left out, with no filler

**Given** playback time and the previously held top product
**When** `rankAt(decisions, tMs, held)` is called
**Then** it returns the scene's ranked list and keeps the held top only while the scene ID is unchanged and for at most `holdMs` (AD-17)
**And** a change of outcome between scenes, or any category flag turning on, releases the hold at once
**And** `rankAt` never changes what `resolvePause` returns
**And** tests cover hold, expiry at `holdMs`, release on outcome change and release on a flag

### Story 2.2: Live scene panel

As a viewer,
I want a slim panel that shows what the system thinks of the current scene,
So that I can see the context behind the products and the pause.

**Acceptance Criteria:**

**Given** the clip is playing
**When** the playback time enters a new scene (via `sceneAt`)
**Then** the panel shows eyebrow keys Scene and Sentiment, the context label (primary and optional secondary), the mood label, and the brand-safe tag as an accent outline pill, read from `panel` only (UX-DR6)
**And** it shows "Based on this scene and the previous 3"
**And** a scene with analysis unavailable shows "Analysis unavailable for this scene."
**And** updates are not announced by a live region, and the current values are readable by screen reader on demand
**And** no free-text scene description is ever rendered

### Story 2.3: Product list with a highlighted top product

As a viewer,
I want to see the top product larger with its reason and score, and the rest in a row or strip,
So that I can tell which product fits the scene best.

**Acceptance Criteria:**

**Given** `rankAt` output for the current time
**When** the list renders on laptop
**Then** the top product shows a 150 px thumb, eyebrow "Sponsored", Lora title, reason line and relevance score in muted label, and up to 9 small products sit in one row as square thumbs with names (UX-DR4, UX-DR7)

**When** the list renders on phone and in-between widths
**Then** the top product thumb is 96 px and the small products scroll sideways as 84 px items with 44 px touch targets

**Given** a scene change
**Then** the top product changes at most once every 5 seconds unless the verdict changes, matching `rankAt`
**And** images for the current list are preloaded so the pause view renders from memory
**And** every thumbnail has alt text with the product name
**And** fewer than 10 ranked products shows only those

## Epic 3: Explore the ad and what it earned

The viewer opens the product page, records a simulated click and returns to the paused clip, sees the demo QR code, expands the session earnings tally, and reads the attribution page.

### Story 3.1: Product page, simulated click and demo QR

As a viewer,
I want to open the advertised product and come back to the exact paused moment,
So that I can look closer without losing my place.

**Acceptance Criteria:**

**Given** an ad card is shown
**When** I select View product
**Then** a product page opens as its own screen with the image, description and key features from `data/products/<id>.json`, and the line "Simulated click recorded." (FR-14, UX-DR12)
**And** the simulated click is added to the session pause log only, never sent anywhere (AD-23)

**When** I use the Back link or browser Back
**Then** I return to the watch screen paused at the same time with the same overlay

**Given** the laptop ad card
**Then** it shows a QR code at 35 percent opacity, visibly marked as a non-functional demo, that encodes no real link (FR-15, UX-DR8)
**And** the product page text renders as text, never HTML

### Story 3.2: Session earnings tally and breakdown

As a viewer,
I want to see what my pauses would have earned, including the ones that showed no ad,
So that the cost of holding an ad back is visible.

**Acceptance Criteria:**

**Given** no pauses yet
**Then** the line below the player reads "Simulated earnings: no pauses yet" (UX-DR13)

**Given** pauses in the session
**Then** the line counts ads shown and held back with the simulated total, for example "Simulated earnings: 2 ads shown, 1 held back (0)"
**And** each pause event counts, including a second pause in the same scene

**When** I tap the line
**Then** it expands in place to a per-pause list: reason or ad, simulated price, and the 70/30 platform and publisher split from policy; a no-ad pause shows 0 with its reason (FR-23, FR-24)
**And** every figure renders through the simulated-value type and carries the word "Simulated" (FR-25, AD-8)
**And** the tally is derived from the session pause log only and resets on reload

### Story 3.3: Attribution page

As a viewer,
I want to see where the products and data come from,
So that the catalog is credited correctly.

**Acceptance Criteria:**

**Given** the clip picker
**When** I follow the attribution link
**Then** a page shows the Amazon.com credit for ABO data, the Collins et al. CVPR 2022 citation (arXiv:2110.06199), a link to the CC BY 4.0 licence, a statement of the changes made (slice, resized images, generated text), and a line that Amazon does not endorse the project (AD-12, UX-DR14)
**And** it states that sample clips are AI-generated
**And** a Back link returns to the picker

## Epic 4: Analyze real sample clips

The author runs the pipeline on the 4 AI-generated sample clips and replaces the fixture with real analysis.

### Story 4.1: Pre-checks and model pin

As the author,
I want the open vendor and licence questions settled before the first real run,
So that the pipeline is built against a pinned model and data I am allowed to use.

**Acceptance Criteria:**

**Given** a few real frames and a `.env` with the Model Studio key (Singapore region)
**When** I run the test script
**Then** it sends one multi-image request to `qwen3.7-flash` and `qwen3.7-plus`, records description quality, latency, token counts and cost, and whether video input is accepted
**And** the chosen VLM, text model and embedding model are pinned by exact name in the spine Stack table

**Given** the ABO download
**When** I open the licence file inside it
**Then** `docs/data-sources.md` records its wording, including any CC BY-NC wording, before any image is copied

**And** the Alibaba Model Studio data terms are read and summarised in one line in `docs/data-sources.md` before any non-generated clip is sent

### Story 4.2: Catalog slice, embedding index and product files

As the author,
I want a local ABO slice with an embedding index and a writer for referenced product files,
So that the pipeline can retrieve candidates and the web can show product pages.

**Acceptance Criteria:**

**Given** the ABO listings and small images
**When** I run the catalog build
**Then** a slice of about 20,000 products and its text-embedding index are written to a local, gitignored folder (AD-12)
**And** the embedding model name is recorded with the index

**Given** product IDs referenced by `decisions`
**When** the product writer runs
**Then** `data/products/<id>.json` (name, image path, description, key features, attribution) and a small image are written for those products only, and unreferenced product files are removed (AD-19)

### Story 4.3: Sample clips and manifests

As the author,
I want 4 short AI-generated clips that fit the catalog, with manifests,
So that the demo has real material to analyze.

**Acceptance Criteria:**

**Given** 4 clips made with an AI tool whose terms allow public use (tool and terms noted in `docs/data-sources.md`)
**Then** each is at most 5 minutes and small enough for GitHub Pages (at most 25 MB, re-encoded if larger)
**And** together they include safe scenes that fit ABO products and scenes for each sensitive category, including one dialogue-heavy clip

**When** I add a clip
**Then** `data/manifest/<clip-id>.json` holds the title, video URL, duration, "AI-generated" label, dialogue flag and attribution key, where the clip ID is the video hash prefix (AD-10, AD-19)
**And** the manifest validates against `bundle-schema`

### Story 4.4: Pipeline runner, ingest and segment

As the author,
I want an `analyze` command that samples frames and splits a clip into capped scenes with safe operating limits,
So that every later stage runs inside one repeatable, cost-capped run.

**Acceptance Criteria:**

**Given** a clip and its manifest
**When** I run `pnpm analyze <clip>`
**Then** ffmpeg samples about 1 frame per second at about 512 px wide and, only if the dialogue flag is set, extracts audio and transcribes it with the pinned Qwen speech model
**And** the transcript is held in memory for segmentation and the describe stage and never written to `analysis` or passed to a judge (AD-5)
**And** scenes are split by frame change, at the 8 second cap, and at dialogue change points, tiling the clip with integer ms times and `s`-plus-7-digit IDs (AD-10, AD-21)
**And** each scene records its `chunk` (chunk 1 is the first 20 seconds) and scenes are ordered by time (FR-22, AD-13)

**And** stages are exported as a library that takes data in and returns an `analysis` object, with file reading and writing only in the CLI (AD-13)
**And** each model call has a timeout and bounded retry, a stage failure is stored as a typed per-scene error, the run aborts at the cost cap in config, and pinned model names, token counts and cost per stage are recorded (AD-22)
**And** keys are read only from `.env`

### Story 4.5: Describe each scene

As the author,
I want the VLM to write one paraphrased description per scene,
So that judges never see raw dialogue or on-screen text.

**Acceptance Criteria:**

**Given** a scene's sampled frames and, when the clip has dialogue, its speech-to-text output
**When** the describe stage runs
**Then** the Qwen VLM returns one description that paraphrases and never quotes on-screen text or speech, with dialogue turned into a neutral summary inside this stage (AD-5)
**And** a frame that cannot be described sets the scene `status: error`
**And** a prompt-injection test clip or fixture with on-screen instructions produces a description that does not carry the instruction, and the scene does not unlock an ad (NFR5)

### Story 4.6: Judge scenes with Jev and Qwen

As the author,
I want both judges to answer the safety questions and Jev to give scene type and sentiment,
So that an ad needs two independent safe verdicts.

**Acceptance Criteria:**

**Given** a scene description
**When** `SceneJudge.judgeScene(description)` runs
**Then** Jev (`jev-1.14.0`, text only, shuffled Choice options, no image header) returns scene type (primary and optional secondary from the fixed list), 5-level sentiment and the six category probabilities, all in one request per scene
**And** the Qwen judge answers the same six category questions
**And** each judge's result is a total record with `status`, `verdict`, `confidence` and all six `{ flagged, p }` keys (AD-15)
**And** when Jev errors, the Qwen judge supplies scene type and sentiment but never a safety verdict in place of Jev, so the scene resolves to analysis unavailable
**And** safety fields are the worst case over the scene's sampled frames and dialogue windows (AD-21)
**And** the scene-type list is the project's own and the IAB file is not committed

### Story 4.7: Retrieve candidates and score fit

As the author,
I want candidate products retrieved by embedding and scored by Jev with recent context,
So that the ranked list reflects the scene and the previous 3 scenes.

**Acceptance Criteria:**

**Given** a scene description and the local index
**When** retrieve and fit run
**Then** top candidates are retrieved by cosine similarity, and `SceneJudge.judgeFit(description, candidates)` returns a Jev fit probability per candidate in one request
**And** both the fit probability and the embedding similarity are stored per scene and product for R3b
**And** the ranking score aggregates the previous 3 scenes' fit scores for ranking only; safety never uses other scenes (FR-7, AD-17)

### Story 4.8: Taglines for safe scenes

As the author,
I want short taglines generated only where an ad could be shown,
So that no text is ever written for a sensitive scene.

**Acceptance Criteria:**

**Given** a scene where R1, R2, R5 and R6 pass at thresholds relaxed by `taglineGateMargin`
**When** the generate stage runs
**Then** the Qwen text model writes a tagline for the top candidates using only product data and the scene description, stored with its `taglineCheck` result from `policy.checkTagline` (AD-7, FR-13)
**And** scenes that fail the gate get no tagline call

### Story 4.9: Real analysis replaces the fixture

As a viewer,
I want the deployed demo to run on the 4 real sample clips,
So that what I see comes from actual analysis.

**Acceptance Criteria:**

**Given** the 4 clips analyzed
**When** I run `pnpm decide` and the product writer
**Then** `data/analysis`, `data/decisions` and `data/products` for the 4 clips are committed, CI regenerates `decisions` with no diff, and the site deploys
**And** total model cost for the run is recorded and within the cost cap
**And** the Epic 1 fixture stays as a test fixture and is not shown in the clip picker

## Epic 5: Measure whether it works

The author labels clips and runs eval through the same `resolvePause` the app calls, CI fails on an unsafe ad or a vacuous pass, and results with failures are written to `docs/eval/`.

### Story 5.1: Labels and the eval sweep

As the author,
I want to label clips by time range and sweep every pause time through `resolvePause`,
So that the evaluation tests the exact path the viewer gets.

**Acceptance Criteria:**

**Given** `data/labels/<clip>.json` with time ranges labeled safe or unsafe, sensitive categories, and the human-judged fit of the top product, validated by `bundle-schema`
**When** I run `pnpm eval`
**Then** it calls `resolvePause` for every time from 0 to the duration in 100 ms steps plus every scene boundary at minus 1 ms, 0 ms and plus 1000 ms (AD-3)
**And** labels join to results by time range, never by scene ID (AD-10)
**And** it works on the Epic 1 fixture with a fixture label file

### Story 5.2: Guardrail that cannot pass vacuously

As the author,
I want CI to fail when an ad lands on an unsafe second or when the check had nothing to check,
So that "zero unsafe ads" always means something.

**Acceptance Criteria:**

**Given** the regenerated `decisions` and the labels
**When** the guardrail runs in CI
**Then** it fails if any labeled unsafe time resolves to an ad (NFR7)
**And** it fails when a labeled range has no coverage in `decisions`, when labeled unsafe seconds fall below the minimum in the eval config, or when any sensitive category has zero labeled scenes (AD-11)
**And** a test shows "0 ads in 0 joined unsafe scenes" fails

### Story 5.3: Metrics and failures report

As the author,
I want the eval to write the metrics and every failure to `docs/eval/`,
So that results are published with their failures.

**Acceptance Criteria:**

**When** eval finishes
**Then** `docs/eval/` holds agreement percent on top-product fit against the 80 percent target, the guardrail result, no-ad share, list stability in reorders per minute, cost per clip minute from `analysis` metadata, and per-category coverage (NFR8)
**And** each failure (disagreement, unexpected no-ad, unexpected ad) is listed with clip, time range and reason
**And** a note records whether 1 fps sampling missed short events in the labeled set
**And** the report is plain markdown with no em dashes and no contractions

### Story 5.4: Jev versus Qwen comparison

As the author,
I want a separate offline run that compares the Jev and Qwen judges on the labeled scenes,
So that I can see whether Jev earns its place without changing the shipped path.

**Acceptance Criteria:**

**Given** analyzed clips with both judges' safety answers stored in `analysis`
**When** I run `pnpm eval --compare-judges` on the author's machine with keys in `.env`
**Then** it runs the Qwen judge for scene type, sentiment and fit on the stored descriptions, within the cost cap
**And** `docs/eval/` gets per-category agreement with labels for each judge, their disagreement rate, and the cost of each
**And** the run makes no change to `analysis` or `decisions`, and CI never runs it

### Story 5.5: Browser check for speed and no network

As the author,
I want a browser test that pauses the deployed build,
So that the 500 ms pause and the no-network rule are enforced, not assumed.

**Acceptance Criteria:**

**Given** a production build served locally in CI
**When** a headless browser loads a clip, plays, and pauses at several times including a scene boundary
**Then** each overlay appears within 500 ms of pause (FR-12, NFR1)
**And** no network request happens after the initial load (AD-1, AD-23)
**And** the overlay text matches what `resolvePause` returns for that time
