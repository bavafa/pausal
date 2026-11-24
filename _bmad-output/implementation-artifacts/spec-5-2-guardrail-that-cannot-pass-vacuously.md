---
title: 'Story 5.2: Guardrail that cannot pass vacuously'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** "Zero unsafe ads" means nothing if nothing was checked (AD-11, NFR7).

**Approach:** The guardrail fails on any ad at a labeled unsafe time, a labeled range with no coverage in `decisions` (no decisions file, range past the clip end, or no sweep time inside it), labeled unsafe time below `minUnsafeMs`, a category with no labeled range, and zero joined unsafe times. CI runs `pnpm eval --check`, which also fails when `docs/eval/report.md` is out of date.

</frozen-after-approval>

## Implementation Notes

- `config/eval.json`: `minUnsafeMs` 5000 (schema floor 1000), `agreementTargetPercent` 80.
- Unit tests cover each failure, including "0 ads in 0 joined unsafe pause times".

## Review Triage Log

Layers ran inline in this session (no subagents). Epic 5 ran without check-ins at the user's request; specs were self-approved.

| Finding | Verdict | Evidence / route |
|---|---|---|
| `--check` drift on the report could fail CI after a harmless wording change | low | Accepted: same rule as `decide --check`; run `pnpm eval` and commit. |
