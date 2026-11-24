---
title: 'Story 5.1: Labels and the eval sweep'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The evaluation must test the exact path the viewer gets (AD-3), joined to human labels by time (AD-10).

**Approach:** `bundle-schema` validates `data/labels/<clip>.json` (sorted, non-overlapping half-open ranges, `safe`, `categories`, `topProductFits`). `pnpm eval` calls `policy.resolvePause` at every 100 ms step plus each scene boundary at -1, 0 and +1000 ms and joins each result to the label range holding that time.

</frozen-after-approval>

## Implementation Notes

- Code: `packages/bundle-schema/src/labels.ts`, `packages/pipeline/src/eval.ts`, `eval-cli.ts`, `eval.test.ts`; `config/eval.json`.
- Label format (agent decision): one object per range, `{ startMs, endMs, safe, categories, topProductFits }`. Gaps are unlabeled time. A safe range has no categories; an unsafe range names at least one. `topProductFits` is null when not judged.
- Fit agreement compares the label with the system answer at each pause time: `ad` and `noActiveCampaign` mean "fits", `nothingFits` means "does not fit"; other outcomes are not compared.
- Fixture labels (`data/labels/000000000001.json`) are hand-written test data. They put every sensitive category on the two unsafe fixture scenes so the guardrail can run in CI before real labels exist.

## Review Triage Log

Layers ran inline in this session (no subagents). Epic 5 ran without check-ins at the user's request; specs were self-approved.

| Finding | Verdict | Evidence / route |
|---|---|---|
| Fixture labels name categories the hand-made judges never flagged | low | Accepted: the fixture tests the harness, not the models; the report says so. |
| Fixture stays in the eval set once real labels arrive | medium | Deferred: when AI clip labels land, decide whether to drop the fixture from metrics (it would still guard CI). |
