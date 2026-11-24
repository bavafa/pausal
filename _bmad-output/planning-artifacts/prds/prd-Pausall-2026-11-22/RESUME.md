# RESUME NOTES (for Claude: read this first in a fresh session)

Project-wide resume point. Update after every phase. Last updated: 2026-11-23, Phase 5 build in progress, Epics 1 to 3 done (Stories 1.1 to 1.8, 2.1 to 2.3 and 3.1 to 3.3), all three retrospectives done.

## How to resume
Say "resume Pausall" (or "start phase 5"). Read this file, then the documents listed under "Read first". Do not re-ask answered questions; decision history is in each workspace's `.memlog.md`. The spine (not the memlog) is the build contract.

## Read first
- PRD: `_bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/prd.md` and `addendum.md`
- Policy: `docs/policy/ad-suppression-policy.md` (amended 2026-11-23: rules R1 to R6 plus R3b)
- Architecture: `_bmad-output/planning-artifacts/architecture/architecture-Pausall-2026-11-22/ARCHITECTURE-SPINE.md` (final, 23 ADs) and ADRs 0001 to 0008 in `docs/adr/`. Reviewer reports are in that folder's `reviews/`.
- UX: `_bmad-output/planning-artifacts/ux-designs/ux-Pausall-2026-11-22/DESIGN.md` and `EXPERIENCE.md` (both final), mockups in `mockups/soft-calm.html`
- Docs index: `docs/README.md`; data sources and licences: `docs/data-sources.md`; Jev notes: `docs/discovery/jev-fit.md`

## Phase status
- Phase 1 discovery: done, tag `v0.1-brief` locked (changes to locked docs go through a PR plus CHANGELOG, not created yet).
- Phase 2 PRD and ad suppression policy: done.
- Phase 3 UX: done, spines final. Reviewer gate and bmad-review polish pass skipped by the user.
- Phase 4 architecture: done and approved. Spine final, reviewer gate run (rubric, adversarial, currency, reconcile) and fixes applied, policy, PRD FR-11 and EXPERIENCE reason order updated to match.
- Phase 5 build: planning done. `_bmad-output/planning-artifacts/epics.md` is final (5 epics, 28 stories, fixture-first: web and policy on a hand-authored fixture, then the real pipeline in Epic 4, eval harness in Epic 5). Readiness gate PASS. Tracking in `_bmad-output/implementation-artifacts/sprint-status.yaml` (Epic 1 in progress, Story 1.1 at review, the rest backlog).
- Story 1.1 done (2026-11-23): pnpm workspace (`@pausall/bundle-schema`, `policy`, `pipeline`, `apps/web`), oxlint import boundaries (AD-23), secretlint pre-commit hook and CI scan, GitHub Actions CI that deploys `apps/web` to https://bavafa.github.io/pausall/. Spec, decisions and review log: `_bmad-output/implementation-artifacts/spec-1-1-workspace-scaffold-deployed-to-github-pages.md`. Epic context for build sessions: `_bmad-output/implementation-artifacts/epic-1-context.md` (its stack table predates the Node 26 and pnpm 12.23.0 change; the spine Stack table is current).
- Story 1.2 done (2026-11-23), merged to `main`: hand-written validators in `bundle-schema` for manifest, analysis, decisions, product, thresholds, campaigns and scene types; `config/scene-types.json` holds 67 labels (user decision: fixed list plus an optional free-text `sceneType.freeLabel` in analysis). Analysis relevance is the raw score (fraction), decisions relevance is the rounded integer. Spec: `_bmad-output/implementation-artifacts/spec-1-2-artifact-and-config-schemas-that-fail-closed.md`. Deferred: `deferred-work.md`.
- Story 1.3 done (2026-11-23), merged to `main`: `policy` exports `evaluateScene` (R1 to R6 and R3b, reason order, failed rule ids), `rankFits`, `roundHalfUp`, `priceFor`, `splitPrice`, `ZERO_EARNING`, `SENTIMENT_TABLE`, `checkTagline`, `taglineOrName`. User decisions: price is `round_half_up(bid * ((1 - w) + w * relevance / 100))` with `pricing.relevanceWeight` (start 0.5) in `config/thresholds.json`; mood labels Tense, Somber, Neutral, Relaxed, Joyful. Story 1.5 must write `pricing` into `config/thresholds.json`. Spec: `_bmad-output/implementation-artifacts/spec-1-3-policy-rules-reason-order-and-simulated-money.md`.
- Story 1.4 done (2026-11-23), committed on `main`: `policy` exports `sceneAt(decisions, tMs)` and `resolvePause(decisions, tMs)` returning `{ outcome, scene }`. The look-back set is the scene at `tMs` plus every earlier scene with `endMs > tMs - 1000`. User decisions: all ads but different products give `nothingFits`; the `session` argument is omitted until a story needs it. Deferred to Story 1.7: a pause at `durationMs` (clip ended) gives Analysis unavailable, so the watch screen should not open a pause view on `ended`. Spec: `_bmad-output/implementation-artifacts/spec-1-4-scene-lookup-and-pause-resolution.md`.
- Story 1.5 done (2026-11-23), committed and pushed on `main`: `pnpm decide` (`packages/pipeline/src/decide-cli.ts`, pure logic in `decide.ts`) validates analysis, config, manifest and product files and writes canonical `data/decisions/<clip>.json` (sorted keys, SHA-256 input hashes). `pnpm decide --check` fails on drift, a missing or orphan decisions file and AD-19 product mismatches; CI runs it. `--root <dir>` lets tests run on a temp copy. Fixture clip `000000000001` (7 scenes: ad, each reason, prompt injection, failing tagline) with `config/thresholds.json`, `config/campaigns.json` and three `fixture-*` products. Agent decisions: panel for `analysisUnavailable` or missing inputs is "Unavailable" with `safeTag` caution; `safeTag` is the worse judge verdict. Deferred to 1.7 and 1.8: product image paths and the manifest video URL are placeholders. Spec: `_bmad-output/implementation-artifacts/spec-1-5-decide-command-on-a-hand-authored-fixture.md`.
- Story 1.6 done (2026-11-23): Tailwind v4 with the Soft Calm tokens in `apps/web/src/index.css` (dark by system setting; `contrast.test.ts` checks 4.5:1 from the hex values), Lora and Raleway self-hosted through `@fontsource` 5.3.0, hash routes `#/` and `#/clip/<id>`, clip picker from validated manifests bundled with `import.meta.glob`. Spec: `spec-1-6-clip-picker-in-the-soft-calm-style.md`.
- Story 1.7 done (2026-11-23): watch screen with the native player at 16:9, click, tap and Space toggle, Back to clips, validated `decisions` (null when missing, invalid or not matching the manifest, which shows "Analysis unavailable for this scene."). The fixture clip has a generated 35 s `testsrc2` video at `apps/web/public/media/000000000001.mp4` (command in the spec). Spec: `spec-1-7-watch-screen-with-the-player.md`.
- Story 1.8 done (2026-11-23): pause view. `apps/web/src/pause-view.ts` maps `resolvePause` to the ad card or the pause note (policy wording), failing closed on null decisions or a missing product; `PauseOverlay.tsx` renders it; frame time from `requestVideoFrameCallback`. Only a real pause opens the view; seeks update an open view. Fixture product images are SVGs in `apps/web/public/products/`. Spec: `spec-1-8-pause-view-ad-card-or-pause-note.md`.
- Epic 1 ran without check-ins at the user's request: specs were self-approved and the review layers ran inline (no subagents). Open deferred items in `deferred-work.md` include a Firefox double toggle check and a Safari phone control bar check.
- Epic 1 retrospective done (2026-11-23): `_bmad-output/implementation-artifacts/epic-1-retro-2026-11-23.md`. Action items in `sprint-status.yaml`: 1 and 2 done (spine, `epics.md`, `DESIGN.md` and `epic-1-context.md` updated), 4 done (no browser test before Epic 2; Story 5.5 covers it). Still open: 3 (make `pnpm decide --check` fail on a missing video or product image file), 5 (fresh review of Stories 1.6 to 1.8, started by the user), 6 (Epic 4: land each clip and product with its real asset).
- Epic 2 done (2026-11-23), again without check-ins and with inline review. Context: `epic-2-context.md`.
  - Story 2.1: analysis fits carry `matched` (product `keyFeatures` names); `decisions` ranked items carry a template `reason` ("Fits a kitchen scene: 28 cm, Flat base.") built by `policy` `reasonLine` from `sceneType.primary` and only features found in the product file; lists capped at 10 (`RANKED_MAX`); `decisions.holdMs` copied from config so `rankAt` reads no config. `policy` exports `rankAt(decisions, tMs, held)` with `held = { sceneId, productId, sinceMs }`. Agent reading of AD-17: the held top survives a scene change only within `holdMs`, with the same outcome, a safe tag no worse, and the product still ranked in the new scene.
  - Story 2.2: scene panel under the video (`ScenePanel.tsx`, `scene-panel.ts`), safe tag wording "Brand safe", "Caution", "Not brand safe". `seeked` always updates from `currentTime` because `requestVideoFrameCallback` fires late while paused.
  - Story 2.3: product list (`ProductList.tsx`, `product-list.ts`) driven by `rankAt` each frame with `held` in a ref. No list where analysis is unavailable.
  - Specs: `spec-2-1-*`, `spec-2-2-*`, `spec-2-3-*`. New deferred item: reject duplicate product IDs within one scene's fits.
  - Pushed and deployed (CI run 45318211972 passed). The Epic 2 retrospective commit is local until the next push.
- Epic 2 retrospective done (2026-11-23): `_bmad-output/implementation-artifacts/epic-2-retro-2026-11-23.md`, verdict accepted with open items. Four new to-do items in `sprint-status.yaml`; items 1 to 3 settled 2026-11-23:
  1. Done: spine AD-17 now matches `rankAt` (hold survives a scene change within `holdMs` under the three guards); AD-14 notes `holdMs` and the 10-item list with `reason`.
  2. Done: user kept the safe tag wording, the reason line pattern and the hidden list on unavailable scenes as built.
  3. Done: no browser test before Epic 3; Story 5.5 covers it.
  4. Open: in Epic 4, check the ranking hold during real playback.
- Plan for open items: Epic 1 item 3 (`decide --check` on missing files) and Epic 2 item 4 go into Epic 4 (Story 4.3 or 4.9). Epic 1 item 5 waits for the user.
- Epic 3 done (2026-11-23), without check-ins and with inline review. Context: `epic-3-context.md`.
  - Story 3.1: product page at `#/clip/<id>/product/<pid>` (`ProductPage.tsx`); the watch screen stays mounted but hidden under it, so the paused frame and overlay survive Back. Session pause log is `App` state (`session.ts`, one entry per real pause that opens the pause view; a seek while paused adds none). View product sets a `SimulatedClick` (`bundle-schema`) from `policy` `clickFor` on the latest entry. "Simulated click recorded." shows only when opened from the clip. Demo QR text "Demo QR, not a real link".
  - Story 3.2: ad pause view carries `price` and `split` from the scene (missing fails closed). `earnings.ts` builds the line "Simulated earnings: N ads shown ($X.XX), M held back ($0.00)" (agent wording, US dollars) and per-pause rows; `EarningsTally.tsx` expands in place ("Details" or "Hide"). The log covers every clip in the page load.
  - Story 3.3: `#/attribution` (`AttributionPage.tsx`), linked from the picker; outside links open in a new tab so the tally survives.
  - Specs: `spec-3-1-*`, `spec-3-2-*`, `spec-3-3-*`.
- Epic 3 retrospective done (2026-11-23): `_bmad-output/implementation-artifacts/epic-3-retro-2026-11-23.md` (rewritten with the humanizer skill), verdict accepted with open items. Three new open to-do items in `sprint-status.yaml`: user approves the Epic 3 wording and then `EXPERIENCE.md` and `epics.md` are updated; Story 5.5 browser tests cover the pause log; decide which pause a click belongs to after a seek while paused.
- Next: ask the user about the Epic 3 wording item, then Epic 4 (Story 4.1, pre-checks and model pin). Epic 4 needs the user for the Qwen test call, keys and data terms.

## Do first in Phase 5 (small, ordered)
1. Done 2026-11-23. PRD and EXPERIENCE note: FR-22 chunking and the "Analyzing the first scenes" and "pause before analysis" states apply to uploads only for sample clips; F8 has no feature flag in the first release. Two one-line edits.
2. Qwen test call: one multi-image request to `qwen3.7-flash` and `qwen3.7-plus` on real frames. Settles video support, model choice and price. `qwen3-vl-flash` is retired (2026-10-10). Pin the winner in the spine Stack table.
3. Done 2026-11-23: Jev publishes no rate limits; one request per scene, SDK retries 429 with backoff (see jev-fit.md).
4. Open the ABO licence file when building the catalog slice, before copying any image; note the older CC BY-NC wording some Amazon pages show.
5. Read Alibaba Model Studio data terms before the first run on real clips (required for uploads, low risk for AI-generated samples).
6. Done 2026-11-23: versions confirmed with `npm view` and written to the spine Stack table. Node moved to 26 LTS (26.13.1, user decision) and pnpm to 12.23.0; tooling rows added (oxlint, Vitest, secretlint).

## Git
- `main` contains phases 1 to 4, Phase 5 planning and Epics 1 to 3; pushed to github.com/bavafa/pausall up to `309f1a0` (Epic 2 retro items). Epic 3 commits are local until the next push. The repo is public since 2026-11-23 (required for GitHub Pages on the current plan); the README keeps "All rights reserved". Pages source is GitHub Actions. Every push to `main` runs CI and deploys.
- Work happens on a story branch (`story/<key>`) and is fast-forwarded into `main` after review. Merged story branches are deleted.
- Untracked: UX `.working/` scratch copies of the mockups (intentionally not committed).

## Build environment
- pnpm is not installed globally on the author's machine; run it as `npx -y pnpm@12.23.0 <command>`. Local Node is 26.9; CI uses 26.13.1 from `.nvmrc`.
- Dev server: `npx -y pnpm@12.23.0 --filter @pausall/web dev`, then open `http://localhost:5173/pausall/` (`.claude/launch.json` holds the same command, not committed).
- Checks: `pnpm -r build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm secrets`. The pre-commit hook (`.githooks/`) needs `node_modules` installed.
- TypeScript 7 is not supported by typescript-eslint, so lint is oxlint. Packages export `.ts` source; there is no library build step.

## Key decisions (summary)
- Hobby demo, responsive web, laptop and phone, light and dark mode. Uploads off in the first release; nothing for uploads is built except a library seam.
- Visual direction "Soft Calm": Lora headings, Raleway body, teal accent, tinted neutrals, 14 px corners. Video is always the brightest element and keeps 16:9 in every state.
- Pause ad: centered card on laptop; on phone it covers most of the frozen frame with the playback bar visible, tagline, QR and "Shown because" hidden.
- Screens: clip picker (4 sample clips, "AI-generated"), watch screen, pause view (overlay), product page (own screen, Back returns to paused clip), session earnings tally that expands to a per-pause breakdown, attribution page. No advertiser view.
- Architecture (spine):
  - Precompute offline on the author's machine; static web app on GitHub Pages; no model call on the playback path.
  - TypeScript pnpm workspace: `bundle-schema`, `policy` (pure decision authority), `pipeline`, `apps/web`. Vite React SPA, Tailwind v4 tokens, no UI library.
  - Two artifacts: `analysis` (model output, committed) and `decisions` (derived, committed, reproducible, CI regenerates and diffs). The web reads `decisions` and calls only `resolvePause` and `rankAt`.
  - Judges: Jev for scene type, sentiment and fit; Jev and Qwen both run the six safety checks and both must say safe (R5); relevance second signal is R3b (Jev fit plus embedding similarity). Qwen never supplies a safety verdict for Jev.
  - Describe-then-judge: judges see only the VLM description. Fail closed: "analysis unavailable" is checked first.
  - Eval sweeps pause times every 100 ms through the same `resolvePause` and fails CI on empty label joins. Threshold floors are schema invariants.
- Models: Qwen single provider (Singapore region, models by pinned name); Jev model `jev-1.14.0`, text only.

## Open
- R3b pairing and cutoffs are an unconfirmed assumption; test in Phase 6 (fit alone versus fit plus embedding).
- Qwen model choice and video support; Jev rate limits; Alibaba data terms; ABO licence file (see "Do first").
- Product exclusion list for products that are sensitive in a safe scene: after the first evaluation.
- Typography sizes and the in-between breakpoint (mock-derived assumptions), choice of the 4 sample clips and their dialogue flags, 18 untriaged Phase 2 reconcile gaps, trademark and privacy items in the PRD.

## Doc rules from the user
Experiment, not a portfolio: never write portfolio, PM paper trail, reviewer or LinkedIn framing. No em dashes, no contractions in docs. Stop for user approval after each phase.
