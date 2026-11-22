# RESUME NOTES (for Claude: read this first in a fresh session)

Project-wide resume point. Update after every phase.

## How to resume
Say "resume Pausall" (or "start phase 4"). Read this file, then the documents listed under "Read first". Do not re-ask answered questions; decision history is in each workspace's `.memlog.md`.

## Read first
- PRD: `_bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/prd.md` and `addendum.md`
- Policy: `docs/policy/ad-suppression-policy.md`
- UX: `_bmad-output/planning-artifacts/ux-designs/ux-Pausall-2026-11-22/DESIGN.md` and `EXPERIENCE.md` (both final), mockups in `mockups/soft-calm.html`
- Docs index: `docs/README.md`

## Phase status
- Phase 1 discovery: done, tag `v0.1-brief` locked (changes to locked docs go through a PR plus CHANGELOG, not created yet).
- Phase 2 PRD and ad suppression policy: done.
- Phase 3 UX: done, spines final. Reviewer gate and bmad-review polish pass skipped by the user.
- Next: Phase 4 architecture (`bmad-architecture`, ADRs in `docs/adr/`). UI library choice was deferred to Phase 4.

## Git
- `main` contains phases 1 to 3 (fast-forwarded to commit `1a0e8e3`, plus this resume update). Not pushed to github.com/bavafa/pausall.
- Branches `phase-2-prd` and `phase-3-ux` are merged into main and can be deleted.
- Untracked: UX `.working/` scratch copies of the mockups (intentionally not committed).

## Key decisions (summary)
- Hobby demo, responsive web, laptop and phone, light and dark mode.
- Visual direction "Soft Calm": Lora headings, Raleway body, teal accent, tinted neutrals, 14 px corners. Video is always the brightest element and keeps 16:9 in every state.
- Pause ad: centered card on laptop; on phone it covers most of the frozen frame with the playback bar visible, tagline, QR and "Shown because" hidden.
- Screens: clip picker (4 sample clips, "AI-generated"), watch screen, pause view (overlay), product page (own screen, Back returns to paused clip), session earnings tally that expands to a per-pause breakdown. No advertiser view.
- Models: Qwen single provider; Jev as scene judge with plain LLM judge fallback. Uploads off in the first release.
- Open: typography sizes and the in-between breakpoint (mock-derived assumptions), choice of the 4 sample clips, 18 untriaged Phase 2 reconcile gaps.

## Doc rules from the user
Experiment, not a portfolio: never write portfolio, PM paper trail, reviewer or LinkedIn framing. No em dashes, no contractions in docs. Stop for user approval after each phase.
