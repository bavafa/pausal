# RESUME NOTES (for Claude: read this first in a fresh session)

Project-wide resume point. Update after every phase. Last updated: 2026-11-23, Phase 5 planning done, build not started.

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
- Phase 5 build: planning done. `_bmad-output/planning-artifacts/epics.md` is final (5 epics, 28 stories, fixture-first: web and policy on a hand-authored fixture, then the real pipeline in Epic 4, eval harness in Epic 5). Readiness gate PASS. Tracking in `_bmad-output/implementation-artifacts/sprint-status.yaml`, all backlog.
- Next: `bmad-build` on Story 1.1 (workspace scaffold deployed to GitHub Pages), in a fresh session. Then Phase 6 evaluation.
- Small values to set as tunable config during build: the price formula (Story 1.3) and the fixed scene-type list (Story 1.2).

## Do first in Phase 5 (small, ordered)
1. Done 2026-11-23. PRD and EXPERIENCE note: FR-22 chunking and the "Analyzing the first scenes" and "pause before analysis" states apply to uploads only for sample clips; F8 has no feature flag in the first release. Two one-line edits.
2. Qwen test call: one multi-image request to `qwen3.7-flash` and `qwen3.7-plus` on real frames. Settles video support, model choice and price. `qwen3-vl-flash` is retired (2026-10-10). Pin the winner in the spine Stack table.
3. Done 2026-11-23: Jev publishes no rate limits; one request per scene, SDK retries 429 with backoff (see jev-fit.md).
4. Open the ABO licence file when building the catalog slice, before copying any image; note the older CC BY-NC wording some Amazon pages show.
5. Read Alibaba Model Studio data terms before the first run on real clips (required for uploads, low risk for AI-generated samples).
6. Pin dependency versions at scaffold with `npm view`; the spine Stack table lists values confirmed on 2026-11-22 (Node 24 LTS, pnpm 12.21.0, TypeScript 7.0.2, Vite 8.3.8, React 19.3.1, Tailwind 4.3.5, Jev `jev-1.14.0`).

## Git
- `main` contains phases 1 to 4 and is pushed to github.com/bavafa/pausall (head `414d1d7` at the end of Phase 4). Only `main` exists.
- Untracked: UX `.working/` scratch copies of the mockups (intentionally not committed).

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
