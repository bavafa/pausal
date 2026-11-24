---
title: 'Story 4.8: Taglines for safe scenes'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** No text may be generated for a sensitive scene (AD-7, FR-13).

**Approach:** After fit, run `policy.evaluateScene` with `safetyConfidence` lowered and every category cutoff raised by `taglineGateMargin`. Only if R1, R2, R5 and R6 pass, ask the text model for one tagline for the top-ranked product, from product data only, and store it with `taglineCheck` from `policy.checkTagline`.

</frozen-after-approval>

## Implementation Notes

- One tagline per scene, for the top product, because `analysis` holds one `tagline` per scene and `decisions` shows it only for the top product.
- A tagline error is logged and skipped; decisions fall back to the product name.
- Smoke taglines: "Specialty whole bean coffee with a sweet, smoky, smooth dark roast.", "Modern chrome table lamp with a cotton shade for any décor". Gated scenes got no call (unit test fails if the tagline model is called).

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| The story says "top candidates" but the schema has one tagline per scene | low | Resolved: tagline for the top product only. |
