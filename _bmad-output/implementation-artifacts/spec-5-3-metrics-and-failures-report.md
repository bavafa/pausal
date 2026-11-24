---
title: 'Story 5.3: Metrics and failures report'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Results must be published with their failures (NFR8).

**Approach:** `pnpm eval` writes `docs/eval/report.md`: guardrail, agreement against the target, no-ad share, reorders per minute (straight playback through `rankAt` with the held top carried), cost per clip minute, per-category coverage, a failure table (unsafe ad, unexpected ad, unexpected no-ad, disagreement) and the 1 fps note.

</frozen-after-approval>

## Implementation Notes

- Cost per clip minute reads a new optional `usage` block in `analysis` (per stage calls, tokens, cost). `pnpm analyze` now writes it; the spine always said analysis records cost (AD-22), Epic 4 only printed it. Existing analysis files show "not recorded" until rerun.
- The 1 fps note lists unsafe ranges shorter than 2 s and whether they got an ad; the fixture has none, and the report says so.
- No timestamps, so the report is reproducible.

## Review Triage Log

Layers ran inline in this session (no subagents). Epic 5 ran without check-ins at the user's request; specs were self-approved.

| Finding | Verdict | Evidence / route |
|---|---|---|
| Reorders counted per 100 ms step, not per real frame | low | Accepted: same grid as the sweep. |
