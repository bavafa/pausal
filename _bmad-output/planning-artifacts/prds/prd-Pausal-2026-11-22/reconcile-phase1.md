# Phase 1 reconciliation: PRD, addendum and policy vs. discovery inputs

Scope: gaps where prd.md, addendum.md or ad-suppression-policy.md drop or contradict the inputs. Intentional cuts (slider, real ads) ignored.
Severity: H = contradiction or safety/rights relevant, M = requirement dropped, L = minor.

## A. Contradictions (PRD vs policy vs addendum)
1. H. Tagline timing. Policy: generated only when an ad will be shown. Addendum: generated once per scene and product at analysis time and cached. FR-13 is silent. Pick one; the addendum approach generates taglines for scenes that never show an ad and for sensitive scenes.
2. H. Ad gate. Policy has 6 rules (safety confidence >= 0.8, no sensitive category, relevance, campaign, second agreeing signal, analysis ok). FR-10 lists only threshold, campaign and safe. Second-signal rule and per-category flags are absent from FR-1/FR-10; NFR only says injection text cannot "alone" unlock.
3. H. Caution verdicts. Policy blocks caution. FR-4 blocks only missing/low-confidence; FR-10 says "scene is safe", which is ambiguous for caution.
4. M. No-ad reasons. Policy has four (adds "Analysis unavailable"); FR-11 has three. Policy also fixes the order when several fail; PRD does not.
5. M. Thresholds. Policy sets 0.8 safety / 60 relevance / 10 list size. PRD says relevance threshold is chosen in build; no safety confidence threshold in PRD at all.
6. M. Intense dialogue. Policy lists "intense dialogue" as a sensitive category and brief says sentiment combines picture, dialogue and sound. FR-3 and policy say classify from the VLM description, not raw dialogue. The category cannot be judged unless the VLM description carries dialogue content; not stated.
7. L. Tagline check. Policy: check against product data, fall back to product name only, never mention sensitive scene details. FR-13 lacks the fallback and the "no sensitive details" rule.

## B. Dropped requirements and ideas
8. H. Revenue roles. Brief and personas define platform and publisher revenue jobs and rules: price rises with bid and relevance; no revenue when no ad; "the cost of caution must be visible"; simulated 70/30 split. PRD keeps the personas as one line but has no requirement to show simulated price or revenue, the split, or the cost of no-ad outcomes. FR-16 has bid and budget but no use of them (no pricing, no budget exhaustion). Platform/publisher success criteria are missing. (Slider is cut; the rest was not.)
9. M. Advertiser transparency. Persona wants a reason for each shown or withheld ad. PRD gives a reason only for no-ad (viewer-facing) and per-product reason lines; no requirement that a shown ad exposes why it was shown or the scene safety verdict.
10. M. Scene profile detail. Brief: scene type is one primary plus optional secondary labels from a fixed list reviewed against IAB categories; description more than one line. FR-1 says one "scene type", no label list, no secondary labels. Per-category safety reasons are required by brief; FR-1 has "reasons" but categories are only in the policy. Also the profile "is the basis for the No ad because explanation" is not linked to FR-11.
11. M. Model swappability and comparison. Brief and risk 6: every model behind an interface, three-setup comparison, Jev vs plain LLM judge. Addendum mentions the comparison; PRD has no requirement or metric for it. Jev fallback to the LLM judge (early access, no SLA) is not a requirement or NFR.
12. M. Pause before analysis finishes. FR-22 chunked analysis plus FR-2 "playback only reads stored results" leaves undefined what a pause shows in a not-yet-analyzed scene. Policy rule 6 implies "Analysis unavailable"; PRD has no reason for it.
13. M. Catalog gap. Risk 2 mitigation: record the fashion, cars and branded goods gap in the PRD. FR-17 only says clips fit the catalog and failures are shown; the known gap is not recorded.
14. M. Hard cost caps. Risk 4 mitigation: hard caps, caching, analyze once. NFR states a 10 USD budget and counter-metric, but no hard cap or shutoff behavior when exceeded.
15. M. Viewer experience. Personas: "easy to dismiss", "quiet by default". PRD has play closes ad; no explicit dismiss control. Risk 5 (viewers dislike pause ads regardless) is not an open item or hypothesis in PRD.
16. L. Interviews. Brief Q4 (which interviews and when) and personas "validated only after interview plan" are reduced to a one-line "no interviews run"; no plan or owner.
17. L. List stability. Risk 9 mitigation (hysteresis, recency weighting) is only "stable"; fine, but no numeric target for reorders per minute.
18. L. Metrics honesty. Risk 8: report only metrics from existing human labels. PRD has the labeled set but no size, labelers or label protocol; policy asks for labeled scenes per category (not in PRD).

## C. Rights and privacy
19. H. Upload notice wording. Rights checklist requires: own/allowed to use, not kept after analysis, DRM-protected services not supported. FR-21 only states third-party processing of a text description. Addendum adds that the provider must be named (China-hosted); FR-21 does not. Jev terms (vendor may keep derived summary statistics; no retention period) not reflected in PRD.
20. M. Sample clip labeling. Checklist: label "AI-generated" in UI, manifest with tool, plan, date, terms link. PRD has only an open item on terms; no UI label or manifest requirement.
21. M. Attribution detail. Checklist: ABO attribution in app and README with CC BY 4.0 link and Collins et al. citation; product images from ABO only. NFR says "attributions are shown"; no README, citation, or images-only rule.
22. L. Never log frames, audio or transcripts: PRD FR-19 covers; but the Jev/VLM text description derived from uploads is sent to third parties and not covered by "nothing stored" for provider side.
23. L. Customer responsibility for input rights (Jev MCA) supports keeping the upload flag; PRD does not state the flag can ship off (samples-only launch).

## D. Items consistent or fine
Zero unsafe ads guardrail, 500 ms, 1 fps and adaptive sampling question, limits (2 min, 100 MB, 3/day), simulated labeling, no storage, no real QR, ABO slice, IAB file not committed.
