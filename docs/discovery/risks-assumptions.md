# Risks and assumptions log

Purpose: list what could make Pausall fail, riskiest first.
Audience: the author.
Status: draft. Last updated: 2026-11-22.

Ratings are judgements by the author, not measurements. Likelihood and impact are 1 (low) to 5 (high).

| # | Risk or assumption | L | I | Mitigation | Type |
|---|---|---|---|---|---|
| 1 | An unsafe ad shows during a sensitive scene | 3 | 5 | Suppression policy, default to no ad when unsure, guardrail metric target zero, labeled eval set | Risk |
| 2 | Matches look wrong in the demo (catalog gap in fashion, cars, branded goods) | 4 | 4 | Choose clips that fit the catalog, record the gap in the PRD, failure gallery | Risk |
| 3 | Rights problem from clips, uploads or catalog images | 2 | 5 | AI-generated samples only, upload notice, no storage of user media, attribution page | Risk |
| 4 | Cost exceeds the 10 USD per month target | 3 | 3 | Hard caps, caching, analyze once, 3 analyses per visitor per day | Risk |
| 5 | Viewers dislike pause ads regardless of relevance | 3 | 3 | Treat as an open question, show no-ad as a valid outcome, cite sentiment research | Assumption (hypothesis) |
| 6 | Models are too slow or too weak at moment-level scene reading | 3 | 3 | Swappable model interface, three-setup comparison, honest results | Risk |
| 7 | Simulated ad numbers are mistaken for real data | 3 | 4 | Label in UI and docs everywhere | Risk |
| 8 | Metrics claimed without human labels | 2 | 5 | Report only metrics from existing labels | Risk |
| 9 | The list flickers during playback | 3 | 2 | Hysteresis and recency weighting, stability metric | Risk |
| 10 | Pause-to-ad latency exceeds 500 ms | 2 | 3 | Precompute, lookup only at pause | Assumption |
