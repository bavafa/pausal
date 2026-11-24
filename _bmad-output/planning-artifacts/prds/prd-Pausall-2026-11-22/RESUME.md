# RESUME NOTES (for Claude: read this first in a fresh session)

Project-wide resume point. Update after every phase. Last updated: 2026-11-23, Phase 5 build in progress, Stories 1.1 to 1.4 done.

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
- Next: `bmad-build` on Story 1.5 (decide command on a hand-authored fixture). Then the rest of Epic 1, then Phase 6 evaluation.

## Do first in Phase 5 (small, ordered)
1. Done 2026-11-23. PRD and EXPERIENCE note: FR-22 chunking and the "Analyzing the first scenes" and "pause before analysis" states apply to uploads only for sample clips; F8 has no feature flag in the first release. Two one-line edits.
2. Qwen test call: one multi-image request to `qwen3.7-flash` and `qwen3.7-plus` on real frames. Settles video support, model choice and price. `qwen3-vl-flash` is retired (2026-10-10). Pin the winner in the spine Stack table.
3. Done 2026-11-23: Jev publishes no rate limits; one request per scene, SDK retries 429 with backoff (see jev-fit.md).
4. Open the ABO licence file when building the catalog slice, before copying any image; note the older CC BY-NC wording some Amazon pages show.
5. Read Alibaba Model Studio data terms before the first run on real clips (required for uploads, low risk for AI-generated samples).
6. Done 2026-11-23: versions confirmed with `npm view` and written to the spine Stack table. Node moved to 26 LTS (26.13.1, user decision) and pnpm to 12.23.0; tooling rows added (oxlint, Vitest, secretlint).

## Git
- `main` contains phases 1 to 4, Phase 5 planning and Stories 1.1 to 1.3, pushed to github.com/bavafa/pausall. Story 1.4 is committed on `main` locally and not yet pushed. The repo is public since 2026-11-23 (required for GitHub Pages on the current plan); the README keeps "All rights reserved". Pages source is GitHub Actions. Every push to `main` runs CI and deploys.
- Work happens on a story branch (`story/<key>`) and is fast-forwarded into `main` after review. Merged story branches are deleted.
- Untracked: UX `.working/` scratch copies of the mockups (intentionally not committed).

## Build environment
- pnpm is not installed globally on the author's machine; run it as `npx -y pnpm@12.23.0 <command>`. Local Node is 26.9; CI uses 26.13.1 from `.nvmrc`.
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
