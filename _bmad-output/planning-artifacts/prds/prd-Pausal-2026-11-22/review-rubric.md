# PRD Quality Review — Pausal PRD

Calibrated for a hobby demo: light rigor, substance bar still applies.

## Overall verdict
The PRD has a real thesis (read the scene, rank, and know when to show nothing) and the safety-first fallback is stated consistently (FR-4, FR-10, FR-11, NFR). The main risks are a few untestable or contradictory requirements: no defined relevance threshold, "stable" ranking with no bound, stored results versus the no-storage upload rule, and a misplaced F8/F9 block.

## Decision-readiness — adequate
Decisions are stated plainly (no slider, no real payments, no-ad on low confidence). Open items are real open questions. Trade-offs (relevance vs safety) are implicit but clear. No findings beyond below.

## Substance over theater — strong
Three personas, all drive decisions (viewer rule, advertiser "why shown", publisher accepts no ad). Hypothesis caveat is honest. NFRs are mostly product-specific (500 ms, 10 USD, injection rule).

## Strategic coherence — adequate
Thesis is coherent and the metrics validate it (agreement, zero unsafe ads, counter-metric on no-ad rate). Gap: no target for the primary metric.
### Findings
- **medium** Primary metric has no target (Success metrics) — "human-judged agreement" with no pass bar. *Fix:* state a number, e.g. >= X% on the eval set, or "report only".
- **low** Cost counter-metric mixes units (Success metrics) — "cost per clip minute must stay within the monthly cap of 10 USD". *Fix:* state a per-minute figure derived from the cap, or reword.

## Done-ness clarity — thin
### Findings
- **high** Relevance threshold undefined (FR-10, Open items) — the core show/don't-show gate has no value or method, only an [ASSUMPTION] that it is chosen at build. Not testable as written. *Fix:* give an initial value and scale (0-100 per FR-6), and state it is tuned on the eval set.
- **medium** "Stable (no rapid reordering)" and "short memory" are unbounded (FR-8, FR-7) — *Fix:* e.g. max N top-item changes per 10 s; define memory as the last N scenes or seconds. The "reorders per minute" supporting metric has no threshold either.
- **medium** FR-11 reason precedence undefined — if a scene is sensitive and the product has no campaign, which reason shows? *Fix:* order the checks (safety first).
- **low** Fuzzy numbers: "about 1 fps / 512 px / 100 MB", "short expiry" (FR-18, FR-19, FR-20). Acceptable for a demo; give an expiry value.
- **low** FR-9 "brand-safe tag" vs FR-1 three-level verdict (safe/caution/unsafe) — say what the tag shows for caution.

## Scope honesty — adequate
Non-goals are explicit and useful. Open items density is fine for the stakes. One gap: F9/uploads is not in non-goals or MVP framing — the PRD does not say whether uploads are in the first build or only the flagged stretch.
- **low** MVP boundary not stated (F8, F9) — *Fix:* one line marking uploads and chunking as in or out of v1.

## Downstream usability — thin
### Findings
- **high** Structure is broken: F8 and F9 sit under Non-goals, before Success metrics, while F1-F7 come later under "Features and requirements" (prd.md). Requirements are split across the document and FR-18..22 are read before FR-1..17. *Fix:* move F8/F9 into the Features section after F7.
- **medium** Contradiction on storage (FR-1 "stored" vs FR-19, Non-goals) — FR-1/FR-2 say scene profiles are stored and playback reads them; uploads say nothing is stored except short-expiry numeric cache. Unclear where an uploaded clip's profile lives during playback. *Fix:* state that upload profiles live in session or the expiring cache only.
- **medium** FR-2 ("no analysis during playback") vs FR-22 (chunked analysis, list works before whole clip is done) — for chunked clips, analysis runs while playing. *Fix:* say playback reads only completed chunks, and what shows for a not-yet-analyzed scene (FR-4 no-ad covers the ad, not the list).
- **low** No glossary; "scene", "campaign", "relevance" are used consistently enough for a demo, but FR-19/addendum duplicate FR-18/19 text verbatim.
- No UJs; acceptable for this demo (viewer flow is described in the vision).

## Shape fit — adequate
Capability-spec shape fits a hobby experiment. No UJs is fine here.

## Mechanical notes
- FR IDs FR-1..FR-22 contiguous and unique; order in the file is F8, F9, then F1-F7.
- Assumptions: two inline/indexed items (FR-5, Open items). No separate index; fine at this size.
- Addendum duplicates the upload spec (FR-18/19, chunking); keep one source.
- "Jev" is used without a one-line definition in the PRD itself.
