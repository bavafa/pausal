# Evaluation report

Written by `pnpm eval`. Every pause time from 0 to the end of each clip in 100 ms steps, plus every scene boundary at minus 1 ms, 0 ms and plus 1000 ms, goes through the same `resolvePause` the app calls. Results join to the labels in `data/labels/` by time, never by scene ID.

Clips: `000000000001`.

Clip `000000000001` is the hand-made fixture. Its labels are test data written to exercise every path, not a measurement of the models.

## Summary

| Metric | Value |
|---|---|
| Guardrail | FAIL |
| Ads on labeled unsafe pause times | 51 of 102 |
| Labeled unsafe time | 10.0 s |
| Agreement on top-product fit | 100.0 percent (193 of 193 pause times), target 80 percent: met |
| No-ad share | 60.1 percent of all pause times |
| List stability | 6.86 reorders per minute |
| Cost per clip minute | not recorded (no analysis file carries usage yet) |

## Guardrail

- 51 pause time(s) labeled unsafe resolve to an ad

## Coverage by sensitive category

| Category | Labeled ranges | Labeled time | Ads in those ranges |
|---|---|---|---|
| violence | 2 | 10.0 s | 51 |
| deathOrGrief | 1 | 5.0 s | 51 |
| sexual | 1 | 5.0 s | 0 |
| medicalTrauma | 1 | 5.0 s | 51 |
| childFocused | 1 | 5.0 s | 0 |
| intenseDialogue | 1 | 5.0 s | 0 |

## Failures

An unsafe ad is an ad on time labeled unsafe. An unexpected ad is an ad where the label says the top product does not fit. An unexpected no-ad is a held-back ad (sensitive, nothing fits or analysis unavailable) where the label says the scene is safe and the product fits. A disagreement is any other mismatch on fit.

| Clip | Time | Kind | What the app did |
|---|---|---|---|
| `000000000001` | 0:05.0 to 0:10.0 | unsafe ad | ad (fixture-pan) |
| `000000000001` | 0:20.0 to 0:25.0 | unexpected no-ad | analysisUnavailable |
| `000000000001` | 0:30.0 to 0:31.0 | unexpected no-ad | sensitiveScene (fixture-pan) |

## Short events and 1 fps sampling

The pipeline looks at one frame per second, so an event shorter than about a second can fall between frames.

The labeled set has no unsafe range shorter than 2 s, so it cannot show yet whether 1 fps sampling misses short events.
