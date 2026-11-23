# RESUME NOTES (for Claude: read this first in a fresh session)

Project-wide resume point. Update after every phase.

## How to resume
Say "resume Pausall" (or "start phase 4"). Read this file, then the documents listed under "Read first". Do not re-ask answered questions; decision history is in each workspace's `.memlog.md`.

## Read first
- PRD: `_bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/prd.md` and `addendum.md`
- Policy: `docs/policy/ad-suppression-policy.md`
- Architecture: `_bmad-output/planning-artifacts/architecture/architecture-Pausall-2026-11-22/ARCHITECTURE-SPINE.md` (draft, awaiting approval) and ADRs 0001 to 0008 in `docs/adr/`
- UX: `_bmad-output/planning-artifacts/ux-designs/ux-Pausall-2026-11-22/DESIGN.md` and `EXPERIENCE.md` (both final), mockups in `mockups/soft-calm.html`
- Docs index: `docs/README.md`

## Phase status
- Phase 1 discovery: done, tag `v0.1-brief` locked (changes to locked docs go through a PR plus CHANGELOG, not created yet).
- Phase 2 PRD and ad suppression policy: done.
- Phase 3 UX: done, spines final. Reviewer gate and bmad-review polish pass skipped by the user.
- Phase 4 architecture: spine (23 ADs) and 8 ADRs drafted, lint clean. Reviewer gate run (rubric, adversarial, currency, reconcile; reviews in the architecture workspace `reviews/`) and fixes applied. Status draft until the user approves. Policy doc amended 2026-11-23 (rule 5 safety, new R3b, analysis unavailable first). PRD FR-11 and EXPERIENCE reason order updated 2026-11-23. Pending notes (FR-22 and analyzing states are upload-only, F8 has no flag), Qwen model choice (qwen3-vl-flash is retired). Nothing committed.
- Next after approval: Phase 5 (sample clips, catalog slice, scaffold), then Phase 6 evaluation.

## Git
- `main` contains phases 1 to 3 (phase 4 files are uncommitted) and is pushed to github.com/bavafa/pausall. Phase branches were merged and deleted; only `main` exists.
- Untracked: UX `.working/` scratch copies of the mockups (intentionally not committed).

## Key decisions (summary)
- Hobby demo, responsive web, laptop and phone, light and dark mode.
- Visual direction "Soft Calm": Lora headings, Raleway body, teal accent, tinted neutrals, 14 px corners. Video is always the brightest element and keeps 16:9 in every state.
- Pause ad: centered card on laptop; on phone it covers most of the frozen frame with the playback bar visible, tagline, QR and "Shown because" hidden.
- Screens: clip picker (4 sample clips, "AI-generated"), watch screen, pause view (overlay), product page (own screen, Back returns to paused clip), session earnings tally that expands to a per-pause breakdown. No advertiser view.
- Models: Qwen single provider; Jev as scene judge with plain LLM judge fallback. Uploads off in the first release.
- Architecture: precompute offline, static web, TS pnpm workspace (bundle-schema, policy, pipeline, web), Vite React SPA with Tailwind v4 and no UI library, GitHub Pages, analysis and decisions artifacts, Jev primary judge with Jev plus Qwen both required for safety, describe-then-judge.
- Open: relevance second signal (Jev fit plus embedding similarity) is an unconfirmed assumption; dependency versions unpinned; Jev and Qwen terms and rate limits unchecked; FR-22 and UX analyzing states apply to uploads only for samples (PRD and UX note needed).
- Open: typography sizes and the in-between breakpoint (mock-derived assumptions), choice of the 4 sample clips, 18 untriaged Phase 2 reconcile gaps.

## Doc rules from the user
Experiment, not a portfolio: never write portfolio, PM paper trail, reviewer or LinkedIn framing. No em dashes, no contractions in docs. Stop for user approval after each phase.
