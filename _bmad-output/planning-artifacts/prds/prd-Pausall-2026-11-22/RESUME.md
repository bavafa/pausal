# RESUME NOTES (for Claude: read this first in a fresh session)

Rewritten clean at the end of the PRD run. Update after every step.

## How to resume
Say "resume phase 2". Read this file, then `prd.md`, `addendum.md`, `docs/policy/ad-suppression-policy.md`. `.memlog.md` has the full decision history. Do not re-ask answered questions.

## Where things are
- Repo: `/Users/meysam/Documents/AI Projects/Pausall` (private, github.com/bavafa/pausall). Tag `v0.1-brief` is locked; changes to locked docs go through a PR plus CHANGELOG (not created yet).
- PRD workspace: `_bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/`
  - `prd.md` status final: F1-F10, FR-1..25, metrics, NFRs, open items
  - `addendum.md`: Qwen model plan, frame sampling, Jev details
  - `reconcile-phase1.md`: 23 gaps vs Phase 1 docs; top 5 fixed, rest not triaged
  - `review-rubric.md`: rubric review (applied), `digest-phase1.md`: Phase 1 digest
- Policy: `docs/policy/ad-suppression-policy.md` (draft)
- Phase 2 scope (user chose): PRD + ad suppression policy.

## Decisions (all confirmed by the user unless marked)
- Hobby demo, web app. Coaching path, Vision+Features.
- UI: video on top; below it up to 10 sponsored products with thumbnails, top one larger; live scene panel (context, sentiment, brand-safe tag). Ranking uses the current scene plus the previous 3 scenes.
- Pause: ad only if safe scene, relevance >= 60, active campaign, second agreeing signal. Otherwise frozen frame with one reason (sensitive scene / nothing fits well / no active campaign / analysis unavailable). Pressing play closes the ad.
- Action: button on the pause ad opens a simple product page (image, description, features). QR code is shown but visibly non-functional. Generated tagline beside the image, only for safe scenes, no unsupported claims.
- Campaigns: plain synthetic. Criteo not used. Simulated revenue kept minimal (FR-23..25, 70/30 split). Slider cut.
- Models: Qwen single provider (VLM, speech, embeddings, text); Jev classifies scene type, sentiment, brand safety, product relevance; plain LLM judge as fallback and comparison. Model names and prices unverified.
- Sampling (user's original spec): browser samples about 1 fps at about 512 px plus audio, server deletes inputs, nothing stored, clips analyzed in chunks (first 20 s first). Open: is 1 fps enough, adaptive sampling (test in evaluation).
- Uploads off in the first release. Assumptions accepted: 80 percent agreement target, top product changes at most every 5 s, thresholds 0.8 safety confidence and 60 relevance, list size 10.

## Doc rules from the user
Experiment, not a portfolio: never write portfolio, PM paper trail, reviewer or LinkedIn framing. No em dashes, no contractions in docs. Stop for user approval after each phase.

## State
Committed on branch `phase-2-prd` (not pushed, not merged). Skipped: the bmad-review structure and prose polish pass; 18 reconcile gaps untriaged.

## Next action
User asked to commit, which is taken as Phase 2 delivered; confirm approval, then merge, add PRD and policy to `docs/README.md`, and start Phase 3 (UX, `docs/ux/`). Optional first: triage reconcile gaps, polish pass.
