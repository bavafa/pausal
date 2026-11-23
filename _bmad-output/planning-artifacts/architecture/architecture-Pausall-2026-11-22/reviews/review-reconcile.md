# Reconciliation review: ARCHITECTURE-SPINE.md against its inputs

Date: 2026-11-22. Read-only review. Scope: PRD, addendum, ad suppression policy, Jev fit note, data sources, EXPERIENCE.md, DESIGN.md.
Severity: High = a requirement cannot be built or tested from the spine as written, or the spine contradicts an input. Medium = a number, field or behavior is dropped and a builder would have to guess. Low = tone, detail or hygiene.

## Verdict

The spine gets the big shape right (precompute, one policy authority, fail closed, describe then judge), but it never says what `decisions` contains, so the scene panel, product list, pause view, tally and evaluation metrics have no defined data source, and it contradicts itself on whether the browser calls `policy` or only reads `decisions`.

## A. Internal contradictions that block the build (High)

1. **Browser calls policy or only reads decisions?** AD-1 and AD-2 say the web reads `decisions` and the pause view is an in-memory lookup. The layer table and the capability map say the web "calls `packages/policy`". If policy runs in the browser, the web needs `analysis` (which AD-2 forbids). If it does not, price, split, no-ad reason and hysteresis must all be precomputed into `decisions`. Pick one and say it.
2. **`decisions` has no defined shape.** It must carry, per clip: scene profile fields for the panel, a time-indexed ranked list (up to 10 products with relevance and reason line), top product with hysteresis applied, the ad or the no-ad reason, tagline, simulated price and 70/30 split. None of this is listed.
3. **Hysteresis is a timeline, not a per-scene value.** FR-8 (top product changes at most once per 5 s unless the scene verdict changes) depends on time, not scene boundaries. The spine says "applies hysteresis" and never states the 5 s number, the verdict-change exception, or that the output is a time-indexed ranking. The list-stability metric (reorders per minute) cannot be computed without it.
4. **"No request after manifest, `decisions` and video load" (AD-1) is false as designed.** Product images and the product page data are requests. DESIGN.md loads Lora and Raleway from Google Fonts at runtime, which is another request (and a third-party call on a privacy-minded demo). The 500 ms pause also depends on the ad image already being cached, which the spine does not require (preload the top product images, or ship them bundled).
5. **Second signal is mapped to the wrong reason.** Policy rule 5 failing shows "Sensitive scene". AD-6 assumes the second signal is a relevance signal (Jev fit plus embedding similarity), and separately requires Jev and Qwen to both pass safety. A relevance disagreement would then be reported as "Sensitive scene", which breaks the policy table and the EXPERIENCE rule that reasons are accurate. The policy says "a second signal agrees with the first" in the safety rule group (rules 1, 2, 5 are the safety rules in the tagline rules). Decide: rule 5 is the dual safety judge, and relevance needs its own rule, which maps to "Nothing fits well".

## B. Quiet requirements dropped or ambiguous

### Session tally and per-pause breakdown (FR-23 to FR-25; EXPERIENCE Earnings breakdown) (High)
- Spine says the only mutable state is "the session tally and the paused flag" but does not define the tally record. Needed per pause: clip time, shown or held back, reason (enum), simulated price, platform and publisher share. A no-ad pause must record 0 with its reason (FR-24).
- Where the data lives is unstated. Prices and splits for every scene and product must come from `decisions` (or be computed by a browser policy call, see A1). The breakdown list lives only in memory, so state the lifetime: per clip, per visit, or reset on Back to clips. EXPERIENCE says "session" without defining it.
- Price formula (rises with campaign bid and relevance) and the 70/30 split are not in the spine. 70/30 is tagged [ASSUMPTION] in the PRD and should be a config value, not a constant (AD-3 says thresholds are inputs, but the split is not named as one).
- Campaign budget (FR-16: product, bid, budget): a budget that depletes per ad shown would be mutable state that the spine does not allow. Say whether budget is decorative or enforced.
- FR-14 "logs a simulated click": the web makes no request, so the log is in-memory. Say so, and say whether it appears in the tally.
- "Simulated" typing (AD-8) is good, but it lists the QR as a policy output. The QR is a static non-functional image, not a decision; AD-8 should cover only numbers, ad and campaign labels.

### 500 ms pause (FR-12, NFR) (Medium)
- The spine says "in-memory lookup" but never states the 500 ms budget, never says where it is measured (phone and laptop), and has no test or CI check. See A4 for the image dependency. Also the ad card closing instantly on play is an EXPERIENCE rule not in the spine.

### Scene profile fields (FR-1; EXPERIENCE Scene panel) (High)
The spine stores "descriptions, judgments, fit scores" in `analysis` and lets the web read only `decisions`. FR-1 requires, and the scene panel displays, all of the following, and the spine does not route them to `decisions`:
- description (the panel context line);
- primary scene type and optional secondary scene type from the fixed list (FR-4a; the spine mentions a fixed list in AD-12 only and drops "optional secondary");
- sentiment from -1 to +1 with a mood label (the spine maps the score but defines no mood label set, and Jev guidance says to report a bucketed score);
- brand-safety verdict safe, caution or unsafe, with reasons and confidence. The spine never defines how safe, caution and unsafe are derived from per-category probabilities, never states that caution blocks (policy: caution blocks in v1), and never says which "confidence" counts. Jev confidence measures concentration, not correctness (jev-fit); the 0.8 safety confidence threshold needs a defined source.
- Tension to resolve: FR-1 stores safety "reasons", while AD-9 and the policy say a reason never names sensitive details. State that stored reasons are category codes and are not shown verbatim in the UI.

### Live scene panel and product list update from playback time (FR-5 to FR-9) (Medium)
- Spine says state derives from playback time but defines no time-to-scene lookup, no update source (timeupdate or animation frame), and no rule for seeking.
- FR-6 requires a one-line reason per product. AD-7 generates reason lines only for safe scenes. In a sensitive scene the list still shows a top product with a reason, so either reason lines are generated for all scenes (and AD-7 changes) or the list is hidden or blanked in unsafe scenes. UX does not say which.
- Product list size 10, "fewer than 10 fit shows only what ranks", and "no filler" are not in the spine.

### "Based on this scene and the previous 3" (FR-7; EXPERIENCE; DESIGN) (High)
Not in the spine. `judgeFit(description, candidates)` takes one description, so the previous-3-scenes context window is dropped. The ranking input, the number 3, the clip-start edge case (fewer than 3 prior scenes) and the panel caption are all missing. It is tagged [ASSUMPTION] in the PRD, so it should be a config value.

### Phone versus laptop ad content (EXPERIENCE, DESIGN) (Low)
Not in the spine. Phone hides the tagline, QR and "Shown because" line; laptop shows them. The spine should at least say `decisions` carries the full content and the UI decides what to show by width, so no second artifact is needed. The in-between breakpoint (phone treatment until the laptop row fits) is a build detail already in Deferred.

### Labeling of AI-generated clips (FR-17; EXPERIENCE clip picker) (Medium)
Missing. The clip manifest should carry the title and an `aiGenerated` flag that the picker renders as "AI-generated". The spine also drops the open item on which tools make the clips and whether their terms allow public use. FR-17 "failures are shown" (the catalog is weak in fashion, cars, branded goods) has no home either; the eval publishes failures, but the UI statement is not mapped.

### Attribution page (FR-17, NFR, data-sources) (High)
AD-12 says attribution ships on one attribution page, but:
- EXPERIENCE has no attribution surface in its Information Architecture, so the page is reachable from nowhere. Add a footer link or equivalent to both documents.
- The required content is not listed: credit "Amazon.com", cite Collins et al., CVPR 2022 (arXiv:2110.06199), link the CC BY 4.0 licence, state changes made (slice, selection, image resizing), do not imply endorsement. The ABO licence file itself was not opened (data-sources), which is an open check.
- IAB taxonomy: the spine says it is never committed, matching data-sources, but PRD FR-4a says the label list is "reviewed against the IAB taxonomy". State that the review is notes only and the project list is its own.
- The data-sources constraints on Criteo (study only) and Wikidata, Open Food Facts, Etsy (not in MVP) are not repeated, which is acceptable, but a guard against copying Criteo data should be in the rights checklist.

### Accessibility floor (EXPERIENCE) (Medium)
The spine contains none of it. Quiet requirements to bind: WCAG 2.2 AA with the 4.5:1 text tokens in both modes, a polite live region that announces the ad card or pause note text without moving focus, no continuous announcement of scene panel updates, keyboard (Space toggles, Tab reaches View product, Escape or Space resumes), 44 by 44 px touch targets including the sideways strip, `prefers-reduced-motion` removes the overlay fade, and product thumbnail alt text from the product name (so alt text must exist in the product data). Add an AD or a convention row.

### Upload notice text (FR-21; jev-fit risk 2 and 3) (Medium)
Uploads are not built, so the notice is deferred ("the notice flow"). But the required content is not recorded anywhere in the spine: viewer must own the video; nothing is kept; DRM-protected files unsupported; a text description of the clip is processed by third-party services, naming Jev and the Qwen provider (a China-hosted API per the addendum); TypeSafe may keep derived summary statistics. The jev-fit rights-checklist line and the customer-responsibility term are also dropped. Also dropped: the 3 per visitor per day limit, 2 minutes, about 100 MB, MP4/MOV/WebM, 1 fps at about 512 px (FR-18 to FR-20). One more mismatch: FR-18 does frame sampling in the browser and uploads only frames and audio, while the spine's `ingest` stage is ffmpeg on a server or local machine. The library seam (AD-13) cannot take browser-side frames unless the stage input is defined as frames plus audio. Finally, PRD F8 says "behind a feature flag"; the spine builds no flag and no upload code. That is a deliberate narrowing and should be recorded as a PRD deviation, not left implicit.

### Jev being text-only (jev-fit) (Medium)
AD-5 (judges get the description only) implies it, but the spine never says Jev never receives images, that the opt-in image header is never used (the docs call it not production-ready), and that audio and video are unsupported. Other Jev constraints dropped:
- 64k token context; accuracy falls with large irrelevant state (relevant to `judgeFit` with 100 candidates).
- Choice leans to the first option; candidates must be shuffled, or use one Noul per pair. The spine does not choose, and "judgeFit(description, candidates)" hides it.
- Jev cannot write text; the spine does say a model writes reasons, but the template-versus-LLM choice for the reason line is open.
- No SLA; rate limits only in the console; "Not read" items (changelog, trust center, subprocessors, Choice/Noul/Box pages, calibration numbers) were to be checked before the architecture is locked. The spine's Deferred list covers rate limits, terms and model names only.
- PRD FR-4a says the plain LLM judge is the fallback if Jev is unavailable. AD-6 requires both Jev and Qwen to pass safety, so a Jev outage means no ad for any scene. That is fail-closed, but it is not a fallback. Say so explicitly, or relax it.
- Prompt injection residual: AD-5 stops transcript, frame text and OCR from reaching judges, but the VLM description may still quote on-screen text. Add a rule that the describe step does not reproduce text or instructions from the frames verbatim.

### Evaluation harness outputs (PRD success metrics; policy Evaluation) (High)
The spine has an `eval` CLI, `docs/eval/` and a CI guardrail. It does not specify outputs. Dropped:
- Primary metric: human-judged agreement that the top product fits the scene, target 80 percent.
- Guardrail: zero ads shown in scenes a human labeled unsafe.
- Supporting metrics: share of pauses that show no ad, list stability (reorders per minute), analysis cost per clip minute.
- Counter-metrics: no-ad rate must not rise without a matching agreement gain; monthly cost under 10 USD.
- Per-category labeled test scenes with both triggering and non-triggering clips (six categories).
- Jev versus Qwen judge comparison, and the 1 fps versus adaptive sampling comparison (spine only mentions the first and defers the second).
- Failures published with results.
- No location for the labeled evaluation set in the repo tree (labels are inputs to CI, so they must be committed).
- Thresholds under tuning: 0.8, 60, 10 are the policy starting values and none appears in the spine or in a named config key.

## C. Conflicts with the precompute decision (PRD and UX statements that no longer hold)

1. **FR-22 and F9 chunked analysis (High).** With precompute, nothing is analyzed while the viewer watches, so "first 20 seconds first" has no user-visible effect. AD-13 turns it into an ordering rule inside a static file, which is untestable and meaningless. The Deferred line "FR-22 and the analyzing UX states apply to uploads only for samples" is garbled. Recommended: amend the PRD so F9 belongs to the upload seam only, and mark FR-22 not applicable to the first release.
2. **"Analyzing the first scenes…" scene panel state, the empty product placeholders, and the "Pause before analysis reaches the scene" state (EXPERIENCE State Patterns, Voice table, Flow 1 step 2 and Failure line) (High).** These cannot occur for precomputed samples. They can only be mapped to (a) the loading state while `decisions` and the manifest fetch, which needs different copy, or (b) removed. The reason "Analysis unavailable" is still reachable through a missing or invalid artifact and a per-scene typed pipeline error, and the "Analysis failed" state stays valid. The spine's AD-4 text "an unanalyzed scene" is the only residue.
3. **FR-2 "results held for the session" (Low).** Reads as a runtime hold; it is now a static load. Wording only.
4. **FR-4 "chunk not yet analyzed counts as analysis unavailable" (Low).** Same as above.
5. **PRD FR-18 to FR-21 and F8 feature flag (Medium).** See the upload notice section.
6. **UX Foundation says no UI library is chosen and that it is a Phase 4 decision, while the spine stack adds Tailwind v4 and React and the ADR is titled "no UI library" (Low).** Fine, but EXPERIENCE open item should be closed and DESIGN tokens (light and dark following system, Lora, Raleway, the colour tokens, frozen-frame filter) mapped to the Tailwind theme.

## D. Other gaps

- **Product page and Back behavior (Medium).** EXPERIENCE requires that browser Back and the Back link return to the paused clip in the same paused state, and that the tally persists. The spine says nothing about routing. GitHub Pages has no server-side SPA fallback, so use hash routing or a 404 redirect. State beyond the paused flag (playback position, route, expanded breakdown) is also mutable; the "only mutable state" claim is wrong.
- **Product page data (Medium).** Image, description and key features per product must ship (AD-12 copies "only products that appear in an artifact" and small images). The product data schema is not named in `bundle-schema`.
- **Tagline check (Low).** The policy requires a check against product data and no mention of sensitive scene details. The spine only says "checked against product data". Add the scene-detail rule and say who checks (rule-based or LLM).
- **Hosting limits (Low).** GitHub Pages size limits for four videos of up to 2 minutes are not noted. Clips up to 2 minutes and about 24 scenes are not stated as limits.
- **Stack versus addendum (Low).** The addendum plans a Qwen speech-to-text model (skipped for clips without dialogue) and 3 to 4 evenly spaced frames per scene; the stack table and the pipeline diagram show neither an STT stage nor frames per scene. AD-5 mentions speech to text, so the stage exists in prose only. OpenRouter as an alternative provider is dropped.
- **Open PRD items dropped from Deferred (Low).** Trademark check on the name; EU and UK privacy position; which AI tools make the clips and their terms; Jev numeric sentiment access.
- **Sources (Low).** `sources:` lists EXPERIENCE.md but not DESIGN.md, which is an input here.
- **Tone (Low).** The spine follows the no em dash and no contraction rule. The EXPERIENCE voice rules (calm, short, never apologizes) appear in the spine only as "follow EXPERIENCE", with no check that reason strings are a closed set mapped from the enum, which AD-9 does provide.

## Summary of top findings (for the caller)

1. High: web calls policy or only reads decisions is contradictory (A1), and the `decisions` shape is undefined (A2), which leaves the scene profile fields, time-indexed list, tally and breakdown without a defined data source.
2. High: hysteresis is stated without its 5 s rule or a timeline output (A3).
3. High: second signal is assigned to relevance but mapped by policy to "Sensitive scene" (A5).
4. High: "previous 3 scenes" and the other numbers (0.8, 60, 10, 70/30, 5 s, 20 s) are missing from the spine.
5. High: FR-22 chunking and the "analyzing" states are obsolete under precompute and need PRD and UX amendments.
6. High: the evaluation harness outputs (80 percent agreement, zero-unsafe guardrail, stability, cost, per-category sets, labeled set location) are not specified.
7. High: attribution page content is unspecified and unreachable in the UX.
8. Medium: AD-1 "no request" is contradicted by images and Google Fonts; 500 ms has no budget or test; accessibility floor, AI-generated labels, upload notice text, and Jev constraints (text only, shuffle, fallback semantics) are absent or soft.
