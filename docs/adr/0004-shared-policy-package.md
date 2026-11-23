# ADR 0004: A shared policy package is the single decision authority

Status: accepted. Date: 2026-11-22. Spine: AD-3, AD-4, AD-8, AD-9.

## Context
The guardrail is zero ads in scenes a human labeled unsafe. That claim is only meaningful if the evaluation tests the same logic the app ships.

## Decision
`packages/policy` is pure code with no I/O. It decides ad or no ad, picks the no-ad reason from one enum in policy order, prices an ad, splits revenue and applies hysteresis. Thresholds and campaigns are inputs. Simulated values are typed with a `simulated` marker. Missing or invalid data fails closed to "analysis unavailable", which is checked before every other reason. Rules are named R1 to R6 and R3b, and the evaluation sweeps pause times through the same `resolvePause` the app calls.

## Consequences
- The evaluation, CI and the browser call the same functions.
- The UI cannot show a simulated number without its label, and cannot invent a reason.
- Every rule in the suppression policy needs a test in this package.
