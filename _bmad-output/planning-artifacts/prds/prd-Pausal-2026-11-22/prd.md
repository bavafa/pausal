---
title: Pausal PRD
status: final
created: 2026-11-22
updated: 2026-11-23
---

# Pausal PRD

## Problem and vision
Pause moments on streaming video are mostly blank. An ad shown there can be relevant, or it can be harmful when it lands on a grief or violence scene. Pausal is an experiment that tests whether a system can read the scene, rank sponsored products that fit it and the video so far, and know when to show nothing.

The viewer watches a clip with a live scene panel and a ranked product list below it. On pause, either a relevant sponsored product appears with a short tagline and an action button, or the frame stays frozen with a one-line reason.

## Users
- Viewer: a person watching a clip who pauses it. The viewer sees an ad only when the scene is safe and a product clearly fits it. Pressing play closes the ad, and no ad ever covers the video while it plays.
- Advertiser (simulated): a brand that runs a campaign for a product. The advertiser wants its ad shown only in suitable, relevant moments, and wants to see why an ad was or was not shown.
- Platform and publisher (simulated): the service that hosts the video and the owner of the video. They earn from ads that are shown, and they accept showing no ad when a scene is sensitive.
These are hypotheses from Phase 1; no interviews have been run.

## Non-goals
- No real advertisers, bids, payments or conversions. No relevance-versus-revenue slider.
- No model training and no claims about how any platform works internally.
- No commercial footage. No storing of uploaded media, frames, audio or transcripts.
- No working QR code or real cart link.

## Features and requirements

All ads, campaigns, bids and conversions are simulated and labeled as such in the UI.

### F1. Scene analysis (once per clip)
- FR-1 The system splits a clip of up to 5 minutes (raised from 2 minutes on 2026-11-24 by the author; the upload limit in FR-20 is unchanged) into scenes and stores a scene profile for each: description, scene type, sentiment (-1 to +1 with a mood label), brand-safety verdict (safe, caution, unsafe) with reasons and confidence.
- FR-2 Playback and pause only read results held for the session; no analysis blocks playback. For uploads, results are held only as FR-19 allows.
- FR-3 Brand safety is classified from the scene description, not from raw dialogue or on-screen text.
- FR-4 A missing or low-confidence verdict counts as not safe. A scene whose chunk is not yet analyzed counts as analysis unavailable.
- FR-4a Scene type uses a primary and an optional secondary label from a fixed list reviewed against the IAB taxonomy. The scene judge sits behind a swappable interface so Jev can be compared with a plain LLM judge, which is also the fallback if Jev is unavailable.

### F2. Live product list
- FR-5 Below the video, show up to 10 sponsored products with thumbnail and name; the top product is highlighted and larger. [ASSUMPTION] 10 at launch, lowered if bottom items make no sense.
- FR-6 Each product has a 0-100 relevance score and a one-line reason.
- FR-7 Ranking uses the current scene plus the previous 3 scenes of the clip. [ASSUMPTION]
- FR-8 The list updates as the clip plays. Stable means the top product changes at most once every 5 seconds unless the scene verdict changes. [ASSUMPTION]

### F3. Live scene panel
- FR-9 Beside or below the list, show the current scene context, sentiment and brand-safe tag, updating as the clip plays.

### F4. Pause view
- FR-10 On pause, if the top product is at or above the relevance threshold (60 of 100 at launch, set in the policy and tuned in the evaluation), has an active campaign and the scene is safe, show the sponsored ad (all rules in the ad suppression policy must pass, including the safety confidence, the second agreeing signal and the sensitive categories): product image, generated tagline and an action button.
- FR-11 Otherwise show the frozen frame with one reason, chosen in the order set in the policy: "analysis unavailable" (checked first), "sensitive scene", "nothing fits well" or "no active campaign".
- FR-12 The pause view appears in under 500 ms (stored lookup only).
- FR-13 The tagline is generated only for scenes that pass the policy safety rules, and the generated tagline is tied to the scene, makes no claim the product data does not support, and is never shown in a scene that is not safe.

### F5. Action and product page
- FR-14 The ad has a button that opens a simple product page with image, description and key features, and logs a simulated click.
- FR-15 The ad also shows a QR code that is visibly marked as a non-functional demo.

### F6. Simulated campaigns
- FR-16 A hand-made set of campaigns (product, bid, budget) covers a subset of the catalog; products without a campaign can rank but never get the pause ad.

### F7. Catalog
- FR-17 Products come from the Amazon Berkeley Objects slice with attribution. The catalog is weak in fashion, cars and branded goods, so clips are chosen to fit it and failures are shown. Sample clips are labeled "AI-generated" in the UI.

### F8. Uploads (off in the first release, samples only; no feature flag is built, only a library seam, see AD-13 in the architecture spine)
- FR-18 The browser samples about 1 frame per second at about 512 px wide and extracts the audio, then sends only those to the server.
- FR-19 The server analyzes, returns results and deletes its inputs. Nothing from uploads is stored or logged; only numeric results are cached by content hash with a short expiry.
- FR-20 Limits: 2 minutes, about 100 MB, MP4, MOV or WebM, 3 analyses per visitor per day.
- FR-21 Before upload, a notice states that the viewer must own the video, that it is not kept, that DRM-protected files are unsupported, and that a text description of the clip is processed by third-party services, naming Jev and the Qwen provider.

### F9. Chunked analysis
- FR-22 Clips are analyzed in chunks, the first 20 seconds first, so the list and scene panel start working before the whole clip is done. Sample clips are precomputed in full, so this only changes what viewers see for uploads; for samples the chunk is recorded on each scene.

### F10. Simulated revenue
- FR-23 Each shown ad has a simulated price that rises with the campaign bid and the relevance score. The platform and publisher split it 70/30. [ASSUMPTION]
- FR-24 A no-ad pause earns 0 and is shown as such with its reason, so the cost of withholding an ad is visible.
- FR-25 All revenue figures are labeled simulated.

## Success metrics
- Primary: human-judged agreement that the top product fits the scene, on the labeled evaluation set. Target 80 percent at launch. [ASSUMPTION]
- Guardrail: ads shown in scenes labeled unsafe is zero on the evaluation set.
- Supporting: share of pauses that show no ad, list stability (reorders per minute), analysis cost per clip minute.
- Counter-metrics: the no-ad rate must not rise without a matching gain in agreement; total monthly cost must stay under 10 USD for the public demo, and cost per clip minute is tracked to explain it.
- The evaluation set includes failures, and results are published with them.

## Non-functional requirements
- Pause view in under 500 ms; playback never waits on analysis.
- Hosting and model cost under 10 USD per month.
- Every simulated number, ad and campaign is labeled as simulated.
- Unknown, low-confidence or failed analysis means no ad.
- Prompt injection: dialogue or on-screen text can never alone unlock an ad.
- Catalog and licence attributions are shown; the IAB taxonomy file is not committed.

## Open items
- [ASSUMPTION] Relevance threshold and campaign set values are chosen during build and tuned in the evaluation.
- Is 1 fps enough for fast scene changes, and should sampling be adaptive? Test in the evaluation.
- Jev access terms, data handling, rate limits and numeric sentiment.
- Qwen model names, prices and terms for frames sent to a China-hosted API.
- Which AI tools make the sample clips and whether their terms allow public use.
- Trademark check on the name; EU and UK privacy position.
