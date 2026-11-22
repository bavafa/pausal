---
title: Pausall project brief
status: draft
created: 2026-11-22
updated: 2026-11-22
---

# Pausall project brief

Purpose: define the problem, product, users, scope and open questions before the PRD.
Audience: PM (Sam), reviewers.
Status: draft. Last updated: 2026-11-22. Items tagged [ASSUMPTION] were inferred and need Sam's review. Evidence: `research.md`, `personas-jtbd.md`, `risks-assumptions.md`, `../data-sources.md`.

## Problem
Streaming services now sell pause ads. Amazon announced interactive pause ads for Prime Video on 2025-09-30, and Netflix said it would sell pause ads programmatically from October 2026 (see `research.md` [1][2]). A pause is a natural moment, but an ad that ignores the scene can feel intrusive or, in a sad or violent scene, harmful to the brand. Public sources describe scene-level targeting vendors but publish no accuracy or suppression data, and no independent pause-ad performance benchmark was found. This is an opportunity to show how a pause ad can be relevant, safe and explainable.

## Product
Pausall turns a clip (up to 2 minutes) into a live, ranked list of catalog products that match the current scene. Each item has a relevance score (0 to 100), a one-line reason and an ad flag. On pause, Pausall shows an ad for the top product, or shows no ad and says why ("No ad: this scene is sensitive" or "No ad: nothing fits well"). A slider trades relevance against simulated revenue. Analysis runs once after load, so playback and pause only read stored results.

## Users (all hypotheses, see `personas-jtbd.md`)
Ad product owner at a streaming or retail media company; brand advertiser; viewer; product leader reviewing the portfolio (primary audience for the demo).

## Goals
1. A public demo at under 10 USD per month that works in a 15-second LinkedIn recording.
2. A complete PM paper trail: discovery, strategy, design, execution.
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
1. IAB Content Taxonomy 3.1 file licence is not stated. Ask IAB Tech Lab before committing the file.
2. Which AI video tools make the sample clips, and do their terms allow public use?
3. What does the demo show when the best match is weak? [ASSUMPTION] no ad, with the reason.
4. Which interviews and surveys will Sam run, and when?
5. Which model APIs fit the cost cap, and do their terms allow uploaded frames?
6. Etsy API terms and the Criteo 1TB licence are unverified (not used in the MVP).
