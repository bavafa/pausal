# ADR 0008: Decisions carry the outcome, one ordered timeline

Status: accepted. Date: 2026-11-22. Spine: AD-14 to AD-21.

## Context
A review found that two builders could follow the first draft to the letter and still diverge: the browser could re-run policy rules it has no inputs for, the time-to-scene lookup was unspecified, a held top product could outlive a scene change, and the guardrail could pass with no labeled scenes joined.

## Decision
`decisions` stores the final outcome per scene, and the browser only calls `resolvePause` and `rankAt` from the policy package. Judgments are total records with all six categories per judge. Scenes tile the clip in integer milliseconds and `sceneAt` is owned by policy. On pause, every scene ending within 1000 ms before the displayed frame must also resolve to the same ad. The ranking window never delays a suppression. The top product is rank 1 and campaign budget is never decremented. Threshold floors are schema invariants. Scenes longer than 8 seconds are split and safety is the worst case over the scene.

## Consequences
- The shipped pause path is the path the evaluation tests, at 100 ms steps and at every boundary.
- A lax threshold or an empty label join fails the build instead of passing quietly.
- More schema code up front; fewer integration surprises.
