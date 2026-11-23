# ADR 0005: Jev as primary judge, dual safety signal, Qwen fallback

Status: accepted. Date: 2026-11-22. Spine: AD-6.

## Context
The PRD requires a swappable scene judge so Jev can be compared with a plain LLM judge, with the LLM judge as fallback. The suppression policy requires a second signal beyond one model probability. Jev has no latency or availability guarantee and its docs list known weak spots.

## Decision
A `SceneJudge` interface with `judgeScene` and `judgeFit`. Jev judges scene type, sentiment and product fit. Jev and the Qwen judge both answer the six sensitive-category questions, and a safe verdict needs both. The Qwen judge covers type, sentiment and fit only when Jev errors. The Jev-versus-Qwen comparison is a separate offline evaluation run and is never on the shipped path.

## Consequences
- Independent models guard the highest-impact risk, at the cost of about six extra questions per scene.
- Fit scoring, the expensive part, runs once.
- Rule 5 is the safety second signal. The relevance second signal (Jev fit plus embedding similarity) is a separate rule 3b whose failure shows "Nothing fits well". The policy document was amended to define R3b on 2026-11-23.
- The Qwen judge never supplies a safety verdict in place of Jev, so a Jev outage on safety means no ads until the pipeline is re-run.
- Rejected: both judges on every question (extra cost, no consumer), and a single judge with a second signal from the same description (weaker independence).
