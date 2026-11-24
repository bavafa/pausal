---
title: 'Story 5.4: Jev versus Qwen comparison'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Show whether Jev earns its place without touching the shipped path.

**Approach:** `pnpm eval --compare-judges` (author machine only) runs the Qwen judge on stored descriptions for scene type, sentiment and the top product fit, and writes `docs/eval/judges.md`: per-category agreement with labels for both judges (stored safety answers), fit agreement, how often the judges differ, and cost. It writes no `analysis` or `decisions` file; CI never runs it.

</frozen-after-approval>

## Implementation Notes

- Qwen fit is one JSON call per scene for the top product, scored against the same R3b cutoff as Jev.
- Live run on the fixture: 6 scenes, $0.0002; `git status` showed no change under `data/analysis` or `data/decisions`.
- Jev cost comes from `analysis.usage` and shows "not recorded" until clips are reanalyzed.

## Review Triage Log

Layers ran inline in this session (no subagents). Epic 5 ran without check-ins at the user's request; specs were self-approved.

| Finding | Verdict | Evidence / route |
|---|---|---|
| Qwen fit prompt is new, not the shipped fit path | low | Accepted: the comparison is offline only. |
