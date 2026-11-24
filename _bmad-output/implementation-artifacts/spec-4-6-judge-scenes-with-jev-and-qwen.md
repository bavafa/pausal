---
title: 'Story 4.6: Judge scenes with Jev and Qwen'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** An ad needs two independent safe verdicts (AD-6, AD-15, R5).

**Approach:** `JevJudge.judgeScene` sends one request per scene with text state (the description) and nine questions: scene type (Choice over the 67 labels, shuffled), sentiment (Score, 5 levels), verdict (Choice over safe, caution, unsafe, shuffled) and six Nouls, one per category. `QwenJudge.judgeScene` asks the same six questions plus scene type, sentiment, verdict and confidence as JSON. Both return a total record. When Jev errors, the scene keeps Qwen's scene type and sentiment, gets `status: error` and `judgments: null`, and resolves to analysis unavailable.

</frozen-after-approval>

## Implementation Notes

- Request format from the TypeSafe docs (read 2026-11-24): Choice `criteria` is an object of option to description (null allowed), Score `criteria` an array low to high, Noul takes `instructions` and optional `criteria` with `true` and `false`. Answers: `choice` with `confidence` and `probabilities`; `score` (0-based mean) with `confidence`; `noul` probability. Worked first time on the live API.
- Shuffles are seeded by the description, so a re-run sends the same request.
- Jev verdict confidence is the Choice confidence. Secondary scene type is the second option when its probability is at least 0.25. Sentiment level is the rounded Score plus 1.
- The run fails if Jev answers with a model name other than the pinned `jev-1.14.0`.
- Smoke results: everyday product shots safe from both with confidence 1; the angry speech scene unsafe (Jev, intense dialogue p 0.74) and caution (Qwen).

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Jev could answer from a newer model under an alias | low | Patched: the pinned name is sent and the answer's model is checked. |
