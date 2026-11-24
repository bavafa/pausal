# Phase 1 digest for the PRD

Sources: product-brief, personas-jtbd, risks-assumptions, jev-fit, data-sources, rights-checklist, domain research (skimmed). Status: draft, 2026-11-22. All persona and revenue content is hypothesis; no interviews run.

## Product in one paragraph
Pausal turns a clip (up to 2 minutes) into a live, ranked list of catalog products that match the current scene. Each item has a 0-100 relevance score, a one-line reason and an ad flag. On pause it shows an ad for the top product, or shows no ad and says why. A slider trades relevance against simulated revenue. Analysis runs once after load; playback and pause only read stored results. It is a small public demo under 10 USD/month, with human-labeled evaluation including failures.

## Users/personas
- Streaming platform ad product owner / the platform as a business: monetize idle pause moments without hurting viewing; withholding an ad can be the better decision.
- Brand advertiser or agency planner / advertiser (seller): suitable, relevant moment; transparency on why an ad appeared; pay nothing for wasted or unsafe slots.
- Viewer: quiet by default, relevant when shown, easy to dismiss.
- Publisher/content owner: revenue share per ad shown, control over adjacency; story-critical scenes (grief, tension) are where ads harm most.

## Core capabilities implied
- Scene profile per scene (stored, read by list, overlay and suppression): description paragraph; scene type (primary plus secondary, fixed label list checked against IAB); sentiment -1..+1 with mood label (Jev yields a bucketed score); brand safety verdict (safe/caution/unsafe) with reasons and confidence; unknown or low confidence means no ad.
- Ranked product list: live, scored 0-100, one-line reason, ad flag; stable (hysteresis, recency weighting).
- Pause ad: top product shown, under 500 ms from pause (lookup only).
- Explained no-ad: "sensitive scene" or "nothing fits well", driven by the scene profile.
- Relevance-vs-revenue slider; simulated revenue rules (price rises with bid and relevance; no ad means no revenue; platform/publisher split simulated 70/30).
- Swappable SceneJudge interface to compare Jev vs plain LLM judge; optional upload behind a feature flag.

## Ad suppression/policy hints
- Categories to test (Jev Noul per category): violence, death or grief, sexual content, medical trauma, child-focused, intense dialogue.
- Rules: default to no ad when unsure; low relevance threshold means no ad; one probability alone never unlocks an ad (second signal); our code applies thresholds.
- No current industry standard confirmed (GARM discontinued 2024-08-09), so Pausal writes and tests its own policy. Guardrail: unsafe ads shown = zero on eval set.
- Risks: unsafe ad in sensitive scene (top risk); prompt injection via dialogue or on-screen text (classify from VLM description, not raw transcript); simulated numbers mistaken for real; list flicker.

## Constraints
- Ads, bids and numbers are simulated and labeled in UI and docs. No real advertisers or bid data.
- Three AI-generated sample clips (labeled "AI-generated"; generator tool terms not yet checked); no commercial footage ever.
- Uploads: 2 min, about 100 MB, MP4/MOV/WebM, 3 analyses per visitor per day; show notice; never store or log frames, audio or transcripts; cache numeric results by content hash, short expiry; notice must say text description goes to a third-party service (Jev).
- Catalog: ABO slice (about 20,000), CC BY 4.0, attribution plus Collins et al. citation; weak in fashion, cars, branded goods, so pick clips that fit and show a failure gallery.
- IAB taxonomy file licence unconfirmed: do not commit the file; ask IAB Tech Lab. Criteo is non-commercial, not used. Etsy, Open Food Facts not in MVP.
- Jev: text only (images opt-in, not production-ready), no text generation, early access, no SLA, vendor-claimed latency/price; keep LLM judge fallback. A VLM plus speech to text must sit in front.
- No training models; no claims about how any platform works internally; no pause-ad benchmarks exist, so all numbers are assumptions.

## Key assumptions and open questions
- Assumptions: relevance label list reviewed against IAB; VLM then Jev pipeline; weak match yields no ad; 70/30 split; viewers' acceptance is unproven (no pause-specific survey found).
- North star (proposed): human-judged relevance agreement on shown ads. Supporting: no-ad rate, cost per clip minute, list stability.
- Open: Jev access, terms, data handling, numeric sentiment; which AI video tools and their terms; model API costs and frame terms; interview/survey plan; EU/UK privacy position; trademark check on name; Jev rate limits and calibration unread.

## Suggested coaching entry point
Vision+Features: the brief already fixes problem, users, scope and non-goals, and the open work is specifying the scene profile, suppression rules and capabilities rather than discovering a user journey.
