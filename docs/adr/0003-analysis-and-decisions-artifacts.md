# ADR 0003: Two artifacts, analysis and decisions

Status: accepted. Date: 2026-11-22. Spine: AD-2, AD-10.

## Context
Thresholds (safety 0.8, relevance 60) and campaigns will be tuned during the evaluation. Model calls are the slow and costly part of the pipeline.

## Decision
`analysis/<clip>.json` holds model outputs only and is committed. `decisions/<clip>.json` is derived from `analysis`, `config/thresholds.json` and `config/campaigns.json` by the policy package, and is regenerated without any model call. The web app reads `decisions` and the clip manifest only. IDs are content-derived and identical in every artifact. `decisions` is committed and byte-for-byte reproducible, records the hashes of its inputs, and CI regenerates it and fails on any diff. The scene-panel fields it carries never include free-text scene content.

## Consequences
- Tuning a threshold or campaign is a cheap re-run and a small diff.
- The web app cannot depend on raw model output.
- Two files per clip to keep in sync, handled by the `decide` command and a CI check that decisions match a fresh derivation.
