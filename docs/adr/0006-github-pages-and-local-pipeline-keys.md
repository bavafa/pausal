# ADR 0006: GitHub Pages hosting and local-only pipeline keys

Status: accepted. Date: 2026-11-22. Spine: AD-11, AD-12.

## Context
Four short sample clips, a static app and a near-zero budget. GitHub Pages documents a 1 GB site size and a 100 GB per month soft bandwidth limit. Cloudflare Pages caps each file at 25 MiB, which would force video into a separate bucket.

## Decision
Serve the app, artifacts and about 10 MB sample videos from GitHub Pages. The pipeline runs only on the author's machine with model keys in a gitignored `.env`. CI type-checks, runs policy tests and the guardrail on committed artifacts, builds and deploys, and makes no model call. The video URL appears only in the clip manifest. Each `analysis` file records token counts and cost, models are called by pinned names, and a run stops at a configured cost cap.

## Consequences
- No new accounts and no secrets in CI.
- Videos live in git history, so clips stay small and few.
- Moving videos to object storage later is a manifest edit.
- Rejected: Cloudflare Pages with R2 (more than four clips need).
