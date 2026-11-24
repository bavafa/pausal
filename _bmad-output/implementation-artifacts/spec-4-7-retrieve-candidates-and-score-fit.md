---
title: 'Story 4.7: Retrieve candidates and score fit'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The ranked list must reflect the scene and the previous 3 scenes (FR-7, AD-17, R3b).

**Approach:** Embed the description, take the top 20 products by cosine similarity, ask Jev one Noul per candidate in one request. Store `jevFitP`, `embeddingSim`, `matched` features and `relevance` per product. Relevance is 100 times a weighted mean of this scene's fit and the same product's fit in up to 3 earlier scenes (weights 1, 0.5, 0.25, 0.125, only where scored). Safety never reads other scenes.

</frozen-after-approval>

## Implementation Notes

- `matched` is the product key features that share a word of 4 or more letters with the description (no model call), so reason lines only use features from the product file.
- Deviation from AD-6: `QwenJudge.judgeFit` is not built. A Jev fit error sets the scene to error (fit), so the scene resolves to analysis unavailable instead of using a second fit source. Simpler and fails closed; revisit if Jev fit errors show up on the real clips.
- Smoke: the coffee scene's top product was a coffee (relevance 93), the sofa scene's an outdoor loveseat.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Earlier-scene fits raise relevance, which also feeds R3 and the price | low | Accepted: AD-17 defines relevance as the ranking score with the 3-scene window; R3b still needs this scene's own Jev fit and similarity. |
