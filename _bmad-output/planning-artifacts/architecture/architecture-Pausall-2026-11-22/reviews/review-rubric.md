# Review: ARCHITECTURE-SPINE.md against the good-spine checklist

Reviewed: 2026-11-22. Reviewer mode: read-only. Inputs: spine, `.memlog.md`, PRD, addendum, ad suppression policy. Not verified: external registries and provider docs (no web check was run), `docs/data-sources.md`, `docs/discovery/jev-fit.md`, EXPERIENCE.md, the ADRs.

## Verdict

The paradigm and the package seams are sound and the dependency rule is clear, but the spine leaves four real divergence points open (what lives in the browser versus in `decisions`, the tagline ordering, the second-signal and judge-combination logic, and the operational envelope), and it names no verified-current tech, so it is not yet a sufficient substrate for the level below.

## Checklist results

| Check | Result |
|---|---|
| Fixes the real divergence points, misses none | Partial. Four gaps below (F-1 to F-4). |
| Every Rule is enforceable and prevents its divergence | Partial. AD-1, AD-3, AD-8 name no enforcement mechanism (F-6). AD-6 and AD-7 are not self-consistent (F-2, F-3). |
| Nothing in Deferred lets two units diverge | Fail. The relevance second signal and the "18 untriaged gaps" can (F-3, F-8). |
| Named tech is verified-current | Fail. Every row says "pin at scaffold" or "unconfirmed" (F-5). |
| Covers the spec's capabilities (F1 to F10, NFR) | Mostly. Gaps listed in the capability table. |
| Operational envelope decided, deferred or open | Fail for six of seven dimensions (F-4). |

## Findings

### F-1 (high) Browser versus `decisions` boundary is ambiguous. Touches AD-1, AD-2, AD-3, AD-4, State convention

- AD-1 says the pause view is an in-memory lookup. AD-2 says `decisions` is derived offline by `policy`. The capability map says F4 is "`apps/web` calling `packages/policy`". The memlog says the browser runs a pure `decidePause(sceneId)` plus hysteresis. These are three different designs: lookup of a precomputed decision, a browser-side decision over precomputed inputs, or both. Two implementers will pick differently.
- The contents of `decisions/<clip>.json` are not defined. The web shows description, sentiment, mood, safe tag (F3), a ranked list with scores and reasons (F2), thumbnails (F2) and taglines (F4). AD-2 says the web never reads `analysis`, so `decisions` must carry copies of those fields, but no AD says which.
- AD-3 puts hysteresis (FR-8, 5 seconds) in `policy`. The State convention says the only mutable web state is the session tally and the paused flag. Hysteresis needs the last shown top product and the time it was shown, so that sentence is false as written, and it is not stated whether hysteresis is a pure function of playback time (precomputable) or stateful over seeks and pauses.
- It is not stated whether `decisions` is committed or built in CI. The memlog says "regenerated"; the layout lists `data/decisions/` beside committed `data/analysis/`. CI "runs the guardrail on committed artifacts", which is only meaningful if `decisions` is committed or regenerated in CI.
- Fix: add one AD, "Pause decision shape", that states where `decidePause` runs, the exact fields `decisions` carries, whether hysteresis is precomputed, and whether `decisions` is committed or CI-built. Amend the State convention.

### F-2 (high) Tagline ordering is circular and breaks the "no model call on threshold change" promise. Touches AD-2, AD-7, AD-3

- AD-7 has the pipeline call `policy` on partial analysis to learn which scenes pass safety, then generate taglines, which are written into `analysis`. AD-2 then claims a threshold or campaign change never needs a model call.
- Counter-case: lower the safety threshold or flip a campaign. A scene or top product that now passes has no tagline and no reason line. Generating one is a model call. The reverse case leaves stored taglines for scenes that no longer pass, which is harmless only if `decisions` drops them; no rule says it must.
- It is also not stated for which products taglines are generated (top 10 per scene, or only candidates with a campaign). The addendum says "cached per scene and product", so the set is open.
- Fix: state the stage order (analyze judgments and fit, run `policy` safety, then generate), state the tagline set, and restate AD-2 honestly: threshold changes inside the already-generated set need no model call; widening it needs a generate-only run. Require `decide` to emit "analysis unavailable" or the product name, not a missing field, when a tagline is absent (fits AD-4).

### F-3 (high) Safety and relevance second-signal logic is under-specified, and it gates every ad. Touches AD-6, AD-4, AD-3, Deferred

- Policy rule 1 needs a safety verdict with confidence of 0.8 or more. AD-6 has two judges (Jev and Qwen) answering six category questions. Not decided: how two verdicts and two confidences combine into one verdict and one confidence, what happens when they disagree on a category (the memlog implies fail closed; the AD does not say so), and which confidence is compared with 0.8.
- Qwen covers scene type, sentiment and fit "only when Jev errors". When Jev errors on fit, the relevance second signal (the Jev fit probability) is gone and the replacement is not defined. Rule 5 then has no defined input. AD-4 implies "no ad", but that should be written.
- The relevance second signal is an `[ASSUMPTION]` inside an AD Rule and is also listed under Deferred. This is a policy input that decides ads. The `bundle-schema` fields (embedding similarity) and `thresholds.json` keys depend on it, so `pipeline`, `policy` and `bundle-schema` authors can diverge now. It should be decided (one default, to be tuned) or listed as an open question with a stated fail-closed default, not deferred.
- The mapping from judge probability to the 0 to 100 relevance score (Data conventions says integers, rule 3 compares to 60) is not stated, nor which unit performs it.
- Fix: one AD, "Verdict combination", with a table: per-category AND, safe only if both say safe, confidence is the minimum of the two, disagreement or any error means not safe, relevance score formula, and the fallback when Jev fit is missing.

### F-4 (high) The operational envelope is mostly missing. Touches AD-11, Consistency Conventions

Decided: hosting (GitHub Pages), where keys live, CI contents, cost recording, typed per-scene errors. Not decided, deferred or raised as open:

| Dimension | Gap |
|---|---|
| Environments | No local dev, preview or rollback story. How the web is developed against committed fixtures, and how a bad `data/` commit is reverted after deploy, are not stated. |
| Provider strategy | No timeouts, retries, backoff, rate-limit handling or model-version pinning. Pipeline re-runs are not reproducible (no temperature or seed rule, no recorded model ID in `analysis`). Provider terms for China-hosted frames are Deferred, which is acceptable, but "Qwen single provider" in the PRD addendum and "Jev via TypeSafe" in the spine are two providers and the spine never says so. |
| Cost control | NFR "under 10 USD per month" is only recorded, not enforced. No per-run budget cap or dry-run estimate stage. Since only the author runs the pipeline, a stated "cost is the author's run budget, checked from `analysis` metadata" is enough, but it is not written. |
| Security | No stated handling for the VLM output that carries injected text (AD-5 only restricts what judges receive). No rule that judge prompts treat the description as data. No rule against rendering model text as HTML in the scene panel. No secret scan to enforce "no keys in the repo". No CSP or third-party script rule for the static site. |
| Observability | None. FR-14 says a click is logged, but the State convention allows only a session tally; where the log goes (console, memory, nowhere) is undecided. Success metrics (no-ad share, reorders per minute, cost per clip minute) have no named producer; they are presumably `eval`, which should be stated. |
| Testing strategy | Only `policy` tests and the guardrail are named. Missing: schema contract tests against committed artifacts, a hysteresis test, a test that the web makes no request after load (AD-1), a latency check for the 500 ms NFR, and a prompt-injection test case in the eval set (NFR). |
| Error handling | Typed per-scene error and the "analysis unavailable" path are decided. Missing: manifest or video load failure, partial artifact (one clip missing), and what a pipeline run does on a provider outage midway (resume versus restart). |

Fix: add an "Operations" section that states each of these as a decision, a deferral with an owner, or an open question. Most are one line each.

### F-5 (medium) No named technology is verified-current. Touches Stack, Deferred

- Every Stack row is "pin at scaffold", "unconfirmed" or "from the console at first run". The memlog records that sources disagreed on the Vite major. That is a one-command check today and should be settled in the spine, not deferred. The same applies to the Qwen model IDs (`qwen3-vl-flash`, `qwen3-vl-plus`), the embedding model, and the Jev endpoint name.
- The "pipeline never imports a model client in `policy`" rule is unaffected, but `SceneJudge` implementers need the Jev call shape (Choice, Score, one Noul per category or pair, per the addendum). The spine does not record this, and the interface signatures in AD-6 do not say what they return (probabilities, labels, errors), which the schema author needs.
- Fix: resolve versions and model IDs with `npm view` and the provider docs now, record the check date, and add the return types of `judgeScene` and `judgeFit` to the spine or to `bundle-schema` as a named contract.

### F-6 (medium) Several Rules name no enforcement mechanism. Touches AD-1, AD-3, AD-8, AD-11, the dependency rule

- The import rule ("web and pipeline never import each other; policy never imports a model client, file system or browser API") has no tool: no dependency-cruiser or ESLint boundary rule, no per-package `package.json` dependency allowlist.
- AD-8 ("no simulated number is a bare `number` in the web code") is a type convention. A TypeScript branded type is bypassable by a cast. State a lint rule or a test that greps the UI for unlabeled figures.
- AD-1 ("no request after load") needs a browser test; AD-3 ("same functions in `eval` and the shipped app") needs the guardrail to import from the built workspace package rather than a copy.
- Fix: add a one-line enforcement note to each of these ADs and a CI step list in AD-11.

### F-7 (medium) Guardrail may not cover what ships. Touches AD-3, AD-11, Capability map

- "Ads shown in scenes labeled unsafe is zero on the evaluation set" is the primary safety guardrail. The spine does not say whether the evaluation set is the four sample clips or separate clips. If separate, the shipped `decisions` are never checked against labels. Require that every shipped clip has labels and that CI fails when a shipped scene is labeled unsafe and its decision is an ad.
- The product list (F2) shows sponsored products in scenes the policy marks sensitive; the PRD allows this, but AD-7 means no reason line exists there while FR-6 says each product has one. State what the list shows in a non-safe scene (names without reasons, or nothing).

### F-8 (low to medium) Stable IDs and Deferred items. Touches AD-10, Deferred

- AD-10 derives scene IDs from scene start time, but start times come from the frame-change segmenter. Changing the segmenter or sampling rate (both Deferred to the evaluation) changes all scene IDs and every join key. Either record the segmenter version in `analysis` or accept that an ID change means a regenerated artifact set, and say so.
- "18 untriaged Phase 2 gaps" in Deferred cannot be assessed from the spine. Untriaged items in a Deferred list are a risk because any of them could be a divergence point; triage them or link the list.
- Layer table says `bundle-schema` has "no logic" but it owns validators; say "no domain logic".
- The spine uses "bundle" nowhere but the memlog and ADRs may still use it for `analysis`/`decisions`. Check the ADRs for the old term.

## Capability map coverage (F1 to F10 and NFR)

| Group | Covered by | Gap |
|---|---|---|
| F1 Scene analysis (FR-1 to FR-4a) | AD-4, AD-5, AD-6, pipeline | Verdict combination (F-3). Scene-type list location is "project's own fixed list", but no file or owner is named. |
| F2 Product list (FR-5 to FR-8) | AD-2, AD-3 | `decisions` fields and hysteresis state (F-1). Reason line in non-safe scenes (F-7). Context window of previous 3 scenes is in the pipeline description only, not an AD; low risk because one unit owns it. |
| F3 Scene panel (FR-9) | AD-1, AD-2 | Same as F2: panel needs profile fields in `decisions`. |
| F4 Pause view (FR-10 to FR-13) | AD-3, AD-4, AD-7, AD-9 | Tagline ordering (F-2). 500 ms has no check (F-4). |
| F5 Product page and QR (FR-14, FR-15) | AD-8 | Click logging destination (F-4). Source of the QR image (static asset versus generated) not stated. Product page data source (the copied product subset in AD-12) is implied, not stated. |
| F6 Campaigns (FR-16) | AD-2, AD-3 | Config shape is free; low risk. A campaign change needing taglines (F-2). |
| F7 Catalog (FR-17) | AD-12 | Covered. Retrieval and candidate count (~200) appear only in the memlog and diagram, not in an AD; one unit owns it, so low risk. |
| F8 Uploads | AD-13 | Intentionally unbuilt; seam only. Fine for the first release. |
| F9 Chunked analysis (FR-22) | AD-13 | Reduced to an ordering rule, flagged in Deferred as needing a PRD note. Reconcile is not run (memlog). Raise it before approval. |
| F10 Simulated revenue (FR-23 to FR-25) | AD-3, AD-8 | The price formula (rises with bid and relevance) is a policy rule but the formula and the 70/30 split location (config or constant) are not stated. AD-3 says thresholds are inputs, so the split should be in `config`. |
| NFR latency, cost, labeling, unknown-means-no-ad, prompt injection, attribution | AD-1, AD-11, AD-8, AD-4, AD-5, AD-12 | Latency and injection lack tests; cost lacks a cap (F-4). |

## What is strong

- The three-layer split with one decision authority (AD-3) and the one-direction artifact flow (AD-2) directly prevent the largest class of divergence, and the dependency graph is simple enough to lint.
- Fail closed (AD-4) and the single reason enum (AD-9) are crisp and testable.
- Rejecting the server, the component library and the catalog in the browser is stated with reasons in the memlog, and the scope is honest about uploads.
- The ad-suppression policy rules map cleanly onto AD-3, AD-4, AD-7 and AD-9.

## Suggested edit order

1. F-1 (pause decision shape), F-2 (tagline order), F-3 (verdict combination). These change code structure.
2. F-4 (Operations section) and F-6 (enforcement notes). These are mostly short additions.
3. F-5 (verify versions now), F-7, F-8.
