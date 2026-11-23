# Adversarial review: Architecture Spine

Target: `ARCHITECTURE-SPINE.md` (draft, 2026-11-22). Read against `docs/policy/ad-suppression-policy.md` and the PRD.
Method: for each AD pair, build two authors who obey every AD literally and still diverge, or find a path where an ad shows in a sensitive scene.

## Verdict

The paradigm is sound, but the spine fixes who owns each layer and not what crosses the layers. The `analysis` to `decisions` handoff, the time-to-scene lookup, the hysteresis state and the second signal are all unspecified, so independent authors will diverge, and at least four paths can put an ad on a sensitive scene without breaking any AD as written.

Severity scale: S1 = ad can reach a sensitive scene or the guardrail can pass vacuously; S2 = incompatible builds that fail integration; S3 = ambiguity that causes rework or drift.

## Findings summary

| # | Finding | Sev | ADs |
|---|---|---|---|
| 1 | Web both "reads decisions only" and "calls policy" at pause; policy inputs are not available in the browser | S2 | AD-1, AD-2, AD-3 |
| 2 | Rule 5 means safety agreement in the policy and AD-7, relevance agreement in AD-6; the reason mapping flips | S1 | AD-6, AD-7, AD-9 |
| 3 | Judgment shape unspecified; a list of flagged categories fails open for any category not run | S1 | AD-2, AD-4, AD-6 |
| 4 | Time to scene lookup: no scene end, no tiling, no pause rule; displayed frame can differ from looked-up scene | S1 | AD-10, AD-13, State convention |
| 5 | Hysteresis: precomputed or runtime, held product can cross a scene change, third mutable state | S1 | AD-3, State convention |
| 6 | Failed analysis shows the wrong reason because AD-9 precedence contradicts AD-4 | S2 | AD-4, AD-9 |
| 7 | "Top product" with or without a campaign; "active" campaign undefined; budget is mutable state | S2 | AD-3, F6 |
| 8 | Eval can pass vacuously: scene ID joins on start time, eval sweeps scenes not pause times | S1 | AD-10, AD-11, AD-3 |
| 9 | Product and clip manifest have no owner or location; web cannot render a product page | S2 | AD-10, AD-12 |
| 10 | Tagline timing: generated under thresholds that can change later; no field says what the web shows | S3 | AD-2, AD-7 |
| 11 | Number conventions: relevance rounding, embedding scale, cents, split rounding, ID time format | S3 | Data conventions, AD-8, AD-10 |
| 12 | Decisions determinism and drift: committed decisions can disagree with analysis plus config | S2 | AD-2, AD-11 |
| 13 | Scene panel needs description and mood from `analysis`, which the web may not read | S2 | AD-2 |
| 14 | Threshold config has no floor; a lax config passes CI | S1 | AD-3, AD-11 |
| 15 | Long static scenes and 1 fps sampling hide sensitive moments inside one scene | S1 | AD-1, AD-13, FR-1 |

## Pairs and paths

### 1. Web author versus pipeline author on who runs policy at pause (S2)

Pair: web author A reads the precomputed outcome from `decisions` (AD-2 says web reads `decisions` and manifest, AD-1 says pause is an in-memory lookup). Web author B follows the capability map ("F4 `apps/web` calling `packages/policy`", AD-3 "the shipped app calls the same functions") and recomputes the outcome in the browser. B needs the thresholds, the campaigns and the per-scene signals. `config/` is not served, and `analysis` is forbidden. B either bundles config into the app (a second truth that can differ from the one used to build `decisions`) or copies analysis fields into `decisions` (violating "derived"). Both obey every AD.

Fix, new AD-14 (replaces the phrase "calls `packages/policy`" in the map):

> **AD-14: Decisions carry the outcome; the browser resolves, never decides.** `decisions/<clip>.json` stores, per scene, the final outcome (`ad` or a no-ad reason), the winning product, price and split, and the inputs hash (`analysisHash`, `thresholdsHash`, `campaignsHash`). The web calls only `resolvePause(decisions, tMs, sessionState)` and the formatters exported by `packages/policy`. `resolvePause` reads no thresholds, no campaigns and no analysis. The web never evaluates rules 1 to 6.

### 2. Rule 5 means two different things (S1)

Policy rule 5: "a second signal agrees with the first" and the reason table maps rule 5 to "Sensitive scene"; AD-7 lists rule 5 as a safety rule that gates tagline generation. AD-6 [ASSUMPTION] makes the second signal a relevance check (Jev fit probability plus embedding similarity). Policy author P implements rule 5 as Jev and Qwen safety agreement. Eval author E implements it as fit plus embedding. Pipeline author G gates taglines on rule 5 "passed", which for E is a product-level fact, so the tagline gate depends on the top product while the sensitive-scene reason fires for a relevance miss ("sensitive scene" shown for an ad that was only a poor fit).

Fix, tighten AD-6 and policy together:

> **AD-6 (add):** Rule 5 is the safety second signal: the Jev and Qwen safety verdicts must agree on safe. The relevance second signal is a separate rule 3b, the Jev fit probability and the embedding similarity both clearing their cutoffs, and its failure maps to "Nothing fits well". The policy document table is amended to match. Rule ids are `R1..R6, R3b` and are the only ids used in code, artifacts and eval output.

If the author prefers the original reading, state it instead and move the embedding check out of AD-6; either way pick one.

### 3. Judgment shape fails open (S1)

AD-2 says `analysis` holds "judgments" without a shape. Pipeline author writes `flags: ["violence"]` (a list of flagged categories); policy author reads "no flag means pass". A category whose question errored, timed out, or was never asked is simply absent from the list and counts as clear. "Treat an absent field as a failed rule" (AD-4) does not catch it, because the field (`flags`) exists. The same holds for two judges: one judge's list missing means one signal missing, read as no flag.

Fix, new AD-15:

> **AD-15: Judgment is a total record.** Each scene stores `judgments: { jev: J, qwen: J }` where `J = { status: "ok" | "error", verdict: "safe" | "caution" | "unsafe", confidence: number, categories: { violence, deathOrGrief, sexual, medicalTrauma, childFocused, intenseDialogue: { flagged: boolean, p: number } } }`. All six category keys are required by `bundle-schema`; a missing key, `null` or `status: "error"` fails validation and the scene resolves to "analysis unavailable". A category is flagged if either judge flags it. "Confidence at or above the safety threshold" means the minimum of the two judges' confidences. A `flagged` boolean is set by the pipeline from `p >= categoryCutoff` where `categoryCutoff` is in `thresholds.json`, and policy recomputes it from `p`, never trusting the boolean alone.

Related ambiguity this closes: with "safe needs both" and "Qwen covers scene type only when Jev errors", a Jev error in the safety questions always means unavailable. State it: the Qwen fallback never supplies a safety verdict in place of Jev.

### 4. Which side maps playback time to a scene, and how pause maps (S1)

Pair: web author uses `scenes.find(s => s.start <= t)` on the array order; pipeline author follows AD-13 ("first 20 seconds of scenes come first in each artifact") and emits chunk 1 scenes then the rest; the array is sorted by chunk, so scenes may be out of time order, and the search returns a wrong scene. Scenes carry only `start` (the ID derivation), no `end`, so gaps are legal. A pause at `t = 12.0` exactly at a boundary: author A takes the new scene, B the old one. `timeupdate` fires about every 250 ms and the `pause` event time lags the displayed frame, so the lookup can return the next, safe scene while the frame on screen belongs to the previous, sensitive scene.

Fix, new AD-16:

> **AD-16: Scene timeline is total, ordered and owned by `policy`.** Scenes in `analysis` and `decisions` are sorted by `startMs` ascending, with an integer `startMs` and `endMs`, half-open intervals `[startMs, endMs)`, tiling `[0, durationMs)` with no gap and no overlap; `bundle-schema` rejects anything else. `chunk` is a field, not an ordering; AD-13 ordering is satisfied by `chunk` and not by array position. `policy` exports `sceneAt(decisions, tMs)`; the web never searches scenes itself. A time outside any scene or on a scene flagged `status: "pending"` resolves to "analysis unavailable". For a pause, the web passes `tMs` of the displayed frame (`requestVideoFrameCallback` mediaTime when available, else `currentTime`) and `resolvePause` evaluates the scene at `tMs` and any scene whose interval comes within 1000 ms before `tMs`; the pause shows an ad only if every one of those scenes resolves to an ad for the same product.

### 5. Hysteresis: where, over what, and what it may delay (S1)

FR-8: top product changes at most once every 5 s unless the scene verdict changes. AD-3 puts hysteresis in `policy`. Unstated: is it computed once over the whole clip into `decisions` (assuming linear playback), or at runtime (needs a held product and last change time, a third mutable web state beyond the tally and paused flag)? Scrubbing, seek and replay break the precomputed version; the runtime version contradicts the State convention. "Scene verdict changes" has no definition (any change of the verdict enum? of any category flag?). Worst case: a held top product from a safe scene keeps being "top" for up to 5 s into a sensitive scene, and a pause there shows its ad if the author evaluates rules against the held product. FR-7 (current plus previous 3 scenes) is unspecified for the fit stage: does `judgeFit` get one concatenated description, so a sensitive previous scene leaks into current-scene text, or is the window applied to scores?

Fix, new AD-17:

> **AD-17: Hysteresis shapes the list only and never a suppression.** The displayed ranking is a pure function `rankAt(decisions, tMs)` that depends only on `decisions` and `tMs` (no held state), computed as: stable top product per scene is precomputed in `decisions` assuming no seek; at runtime the web may hold the previous top only while the scene id is unchanged. The pause outcome is always `decisions[sceneAt(tMs)].outcome` and never reads the held product. A "verdict change" means any change of `outcome` between consecutive scenes or any flag turning on. Hysteresis windows are in `thresholds.json` (`holdMs: 5000`). Fit context (FR-7) is applied in the fit stage as score aggregation over the previous 3 scenes' fit scores for ranking only; safety judgments see the current scene description alone.

### 6. Failed analysis shows the wrong reason (S2)

AD-4: invalid, missing or erroring data "resolves to analysis unavailable". AD-9 and the policy: if several rules fail, show the first row in the order sensitive, nothing fits, no campaign, unavailable. A failed scene fails rules 1, 2, 3 and 5 as well (absent fields are failed rules), so the first row is "Sensitive scene". Policy author follows AD-9 and shows "Sensitive scene" for an API outage; web author follows AD-4 and overrides. Both comply.

Fix, tighten AD-9:

> **AD-9 (add):** Rule 6 and schema validity are evaluated first. If either fails the reason is "analysis unavailable" regardless of the other rules. Otherwise the precedence is sensitive scene, nothing fits well, no active campaign. The policy document order is amended to match.

### 7. "Top product" and "active campaign" (S2)

FR-10 says the top product needs a campaign; FR-16 says products without a campaign can rank. Author A picks the highest-scoring product that has a campaign and shows its ad; author B uses the list top and shows "No active campaign". The UI highlights the list top while the ad shows a different product. "Active" is undefined (date window? remaining budget?). If budget decrements per shown ad this is mutable state outside the tally and makes the outcome depend on pause order.

Fix, new AD-18:

> **AD-18: Top product and campaign activity.** The top product is rank 1 of the full ranked list for the scene (relevance descending, ties broken by lower product id). The pause ad is for that product only. A campaign is active when `active: true` in `campaigns.json`; `budget` is display and price metadata only, never decremented. No campaign for the top product yields "No active campaign" even when a lower product has one.

### 8. The guardrail can pass vacuously (S1)

AD-11 makes the eval guardrail a CI gate. Human labels join to decisions by scene ID, and AD-10 derives scene ID from scene start time. Re-segmenting the clip (a threshold change in the segmenter, which AD-2 says is a model re-run, not a config change) changes every ID, no label matches, and "ads shown in labeled unsafe scenes" is zero because nothing joined. Also, eval iterating scenes does not exercise hysteresis, the boundary rule or the displayed-frame rule from AD-16, so the shipped pause path is not what is tested.

Fix, tighten AD-3 and AD-11:

> **AD-3 (add):** `eval` calls `resolvePause` for every time `t` from 0 to duration in 100 ms steps plus every scene boundary minus 1 ms, plus 0 ms and plus 1000 ms, and compares to human labels keyed by time range, not by scene ID.
> **AD-11 (add):** The eval fails CI when any human-labeled range has no coverage in `decisions`, when the labeled unsafe seconds count is below a minimum recorded in the eval config, or when the number of labeled scenes per category is zero. A guardrail result of "0 ads" with "0 labeled unsafe joined" is a failure.

### 9. Manifest and product catalog have no owner (S2)

The ER diagram has PRODUCT and CLIP but no artifact holds them. AD-12 says "only the products that appear in an artifact are copied in with small images" without naming where. The web product page (FR-14: image, description, key features) needs product fields that `decisions` does not carry and `analysis` may not. Pipeline author writes `data/products/<id>.json`, web author expects fields inline in `decisions`; the manifest (video URL, title, "AI-generated" label, duration, attribution) is written by whom?

Fix, new AD-19:

> **AD-19: Every entity has one owner artifact.** `data/manifest/<clip-id>.json` (clip, video URL, duration, label, scene count) is hand-authored and validated by `bundle-schema`; `data/products/<product-id>.json` (name, image path, description, key features, attribution) is written by `pipeline` from the local catalog and copied only for products referenced by any `decisions`; `analysis` owns scenes, judgments, descriptions, fit scores, taglines; `decisions` owns outcomes, prices, splits and references products by id only. A CI check fails if any id referenced in `decisions` has no product file, or any product file is unreferenced.

### 10. Tagline timing against threshold changes (S3)

AD-7 gates tagline generation on policy rules passing; AD-2 promises that threshold changes need no model call. A threshold lowered after the run makes a scene newly eligible for an ad, but it has no tagline. A threshold raised leaves taglines for scenes that no longer qualify. The tagline check against product data is a pure check; its owner and the stored result are unspecified, and what the web shows when an ad outcome has no tagline is unspecified.

Fix, tighten AD-7:

> **AD-7 (add):** The pipeline generates a tagline for every scene where the safety rules pass under the cutoffs in `thresholds.json` minus a margin recorded as `taglineGateMargin`, and stores both the raw tagline and a `taglineCheck` result. `policy` owns `checkTagline(tagline, product)`. `decisions` carries `tagline` only for outcome `ad`, and it is the product name when the check fails or the tagline is absent. A threshold change that makes a scene eligible without a tagline yields the product name.

### 11. Conventions that diverge on the details (S3)

- Relevance 0 to 100 integer versus a probability 0 to 1: say who rounds (`policy`, round half up) and that the 60 comparison uses the rounded integer.
- Embedding similarity is cosine in [-1, 1], not a probability; the convention table says probabilities are 0 to 1.
- Money: use integer cents for price and split; the 70/30 split rounds the publisher share down and gives the remainder to the platform; sum equals price.
- Time: integer milliseconds in all artifacts and IDs, never float seconds (the Data convention says seconds; replace it). Scene ID format `s<startMs zero padded to 7 digits>`.
- Sentiment: the 5-level to -1..+1 map and mood labels are a table in `policy`; write it down (for example -1, -0.5, 0, 0.5, 1) so the web and eval agree.
- "Active campaign" and the first `simulated: true` wrapper: the 0 earned by a no-ad pause also carries `simulated: true`.
- Session tally increments once per pause event (not per render); a second pause in the same scene counts again. State it, or the tally and the revenue claim differ between authors.

Fix, tighten the Data and formats row of the Consistency Conventions with the points above.

### 12. Decisions determinism and drift (S2)

The tree says `data/decisions/` is "regenerated, served by the web" while AD-11 says CI runs the guardrail "on committed artifacts" and builds. If decisions are committed, they can disagree with `analysis` plus config and CI would test a stale file. If CI regenerates them, the committed copy is irrelevant and the tree is misleading. Different authors will choose differently. Non-deterministic output (timestamps, key order, float formatting) makes the diff noise that AD-10 tries to avoid.

Fix, tighten AD-2 and AD-11:

> **AD-2 (add):** `decisions` is committed and byte-for-byte reproducible: no timestamps, keys sorted, integers only for money and time. It records `analysisHash`, `thresholdsHash` and `campaignsHash`. CI regenerates `decisions` from `analysis` and `config` and fails on any diff to the committed files, then runs the eval guardrail on the regenerated files.

### 13. The scene panel needs data from `analysis` (S2)

F3 shows the scene context, sentiment and brand-safe tag; mood label and description live in `analysis`, which the web may not read (AD-2). One author copies the full model description into `decisions` (including sensitive details, which the pause view and panel then render for a sensitive scene), another invents a short label. The "verdict reasons" in FR-1 can name the sensitive category.

Fix, tighten AD-2 and AD-9:

> **AD-2 (add):** `decisions` carries a `panel` object per scene produced by `policy` from `analysis`: `contextLabel` (the scene type label from the fixed list), `moodLabel`, `sentiment`, and `safeTag` (one of safe, caution, unsafe). It never carries the free-text description or judge reasons. **AD-9 (add):** No field the web renders is free text derived from scene content, except the tagline for an `ad` outcome.

### 14. Threshold config has no floor (S1)

Thresholds are inputs (AD-3), the guardrail is the only protection, and the eval set is small. Setting safety to 0.0 or relevance to 0 in `thresholds.json` can still pass the guardrail on a small set and silently disable rules. AD-4 covers absent fields, not lax ones.

Fix, new AD-20:

> **AD-20: Threshold floors are schema invariants.** `bundle-schema` validates `thresholds.json` with hard bounds: safety confidence at least 0.8, relevance at least 60, both second-signal cutoffs present, all six category cutoffs at most 0.5, `holdMs` at least 5000. Lowering a bound requires editing the schema and an ADR. A missing or out of range value fails the build.

### 15. Long static scenes and 1 fps sampling (S1)

Scenes are segmented by frame change only (stage diagram) and one description is written per scene. A 90-second talking-head scene whose dialogue turns intense or violent in the last 20 seconds is one scene, one description, with the dialogue summarized in a neutral sentence. A sensitive moment between 1 fps samples is never seen. Rule 6 reports success because the analysis finished without error.

Fix, new AD-21:

> **AD-21: Scene length cap and conservative merge.** The segmenter splits any scene longer than 8 seconds into sub-scenes at the cap, and also at dialogue change points from the speech summary stage. Safety fields of a scene are the worst case over its sampled frames and its dialogue summary windows (any flagged category on any window flags the scene). A frame sampled at 1 fps that cannot be described makes the scene `status: "error"`.

## Further paths to an ad in a sensitive scene

| Path | Why it passes the ADs | Closed by |
|---|---|---|
| Missing category in a flag list | AD-4 only fails absent fields, not absent list members | AD-15 |
| Pause on a boundary shows next scene's safe outcome over a sensitive displayed frame | No time rule, no pause rule | AD-16 |
| Held top product from a prior safe scene used on the new scene | Hysteresis spec silent on suppression | AD-17 |
| Eval label join empty, guardrail reads zero | AD-10 IDs are time based, no coverage rule | AD-3, AD-11 additions |
| Lax threshold file | Thresholds are inputs by design | AD-20 |
| Sensitive moment inside a long scene | One description per scene, segmentation by frame change | AD-21 |
| Stale committed `decisions` ahead of corrected `analysis` | No hash or regeneration rule | AD-2 addition |
| Qwen fallback verdict used when Jev errors on safety | AD-6 ambiguous on whether Qwen can stand in | AD-15 note |
| Product that is itself sensitive for the scene (for example a knife set in a kitchen safe scene, or a toy in a child-focused flag) | Policy rules score scene, not product | Out of scope for the first release; note in Deferred and add a product exclusion list in `config/` |

## Summary of proposed AD changes

New: AD-14 (decisions carry outcome), AD-15 (total judgment record), AD-16 (total ordered timeline and pause mapping), AD-17 (hysteresis never suppresses), AD-18 (top product and campaign), AD-19 (entity ownership), AD-20 (threshold floors), AD-21 (scene length cap).
Tightened: AD-2 (determinism, hashes, panel object), AD-3 and AD-11 (eval sweep and coverage), AD-6 (rule 5 meaning), AD-7 (tagline gate and fallback), AD-9 (rule 6 first, no free text), Data and formats (integers, cents, ms, cosine).
Policy document: amend rule 5 and rule 3b and the reason order to match AD-6 and AD-9.
