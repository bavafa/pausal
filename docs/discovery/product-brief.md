---
title: Pausall project brief
status: draft
created: 2026-11-22
updated: 2026-11-22
---

# Pausall project brief

Purpose: define the problem, product, users, scope and open questions before the PRD.
Audience: Sam.
Status: draft. Last updated: 2026-11-22. Items tagged [ASSUMPTION] were inferred and need Sam's review. Evidence: `research.md`, `personas-jtbd.md`, `risks-assumptions.md`, `../data-sources.md`.

## Problem
Streaming services now sell pause ads. Amazon announced interactive pause ads for Prime Video on 2025-09-30, and Netflix said it would sell pause ads programmatically from October 2026 (see `research.md` [1][2]). A pause is a natural moment, but an ad that ignores the scene can feel intrusive or, in a sad or violent scene, harmful to the brand. Public sources describe scene-level targeting vendors but publish no accuracy or suppression data, and no independent pause-ad performance benchmark was found. The question is whether a pause ad can be relevant, safe and explainable.

## Product
Pausall turns a clip (up to 2 minutes) into a live, ranked list of catalog products that match the current scene. Each item has a relevance score (0 to 100), a one-line reason and an ad flag. On pause, Pausall shows an ad for the top product, or shows no ad and says why ("No ad: this scene is sensitive" or "No ad: nothing fits well"). A slider trades relevance against simulated revenue. Analysis runs once after load, so playback and pause only read stored results.

### Scene profile (new requirement)
For every scene, the analysis stores a profile that the list, the pause overlay and the suppression rule all read:
- **Description:** a short paragraph of what is happening, who is present, and the setting (more than one line).
- **Scene type:** one primary label and optional secondary labels, for example kitchen, office, fight, action, dialogue, outdoors, sci-fi. [ASSUMPTION] a fixed label list that is reviewed against IAB categories.
- **Sentiment score:** a number from -1 (very negative) to +1 (very positive), plus a mood label (calm, tense, sad, joyful, and so on). It combines picture, dialogue and sound.
- **Brand safety:** an overall verdict (safe, caution, unsafe) with the reasons (for example violence, grief, child-focused, sexual content) and a confidence value. Unknown or low confidence defaults to no ad.
- The scene profile is the basis for the "No ad because" explanation.
- Which model produces the profile is open (see questions). Every model sits behind an interface so it can be swapped and compared.

## Users and revenue roles (all hypotheses, see `personas-jtbd.md`)
Streaming platform and its ad product owner; publisher or content owner; advertiser; viewer. Each has a revenue job (see `personas-jtbd.md`).

## Goals
1. A small public demo that stays under 10 USD per month.
2. Find out how well existing models read a scene and match products to it, and where they fail.
3. An honest evaluation with human labels, including failures.

## Non-goals
Training models; real advertisers or real bid data; commercial footage; storing uploads; claims about how any platform works internally.

## Success measures (proposed, to be fixed in the PRD)
North star [ASSUMPTION]: human-judged relevance agreement on shown ads. Guardrail: unsafe ads shown, target zero on the eval set. Supporting: no-ad rate, time from pause to ad under 500 ms, cost per clip minute, list stability.

## Scope and constraints
Catalog: Amazon Berkeley Objects, CC BY 4.0, slice of about 20,000 products. Ads and bids are simulated and labeled. Three AI-generated sample clips, optional upload behind a feature flag. Limits: 2 minutes, about 100 MB, 3 analyses per visitor per day, MP4/MOV/WebM.

## Key risks (riskiest first, from `risks-assumptions.md`)
Unsafe ad in a sensitive scene; weak matches from the ABO gap in fashion, cars and branded goods; rights issues; cost overrun; simulated numbers mistaken for real data.

## Open questions
0. Which model should produce the scene profile? Sam named "Jev", which needs to be confirmed. [ASSUMPTION] this means a hosted vision-language model such as Gemini.
0a. How is pause revenue split between platform and publisher? [ASSUMPTION] simulated 70/30 for the demo, labeled as simulated.
1. IAB Content Taxonomy 3.1 file licence is not stated. Ask IAB Tech Lab before committing the file.
2. Which AI video tools make the sample clips, and do their terms allow public use?
3. What does the demo show when the best match is weak? [ASSUMPTION] no ad, with the reason.
4. Which interviews and surveys will Sam run, and when?
5. Which model APIs fit the cost cap, and do their terms allow uploaded frames?
6. Etsy API terms and the Criteo 1TB licence are unverified (not used in the MVP).
