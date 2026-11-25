# ADR 0009: Hold an ad back only when both judges say unsafe; relevance floor 50; look-back keeps the current product

Status: accepted. Date: 2026-11-25. Amends ADR 0005, ADR 0008, policy rules 1, 2 and 5, and AD-20.

## Context
The live sample is a 3 minute excerpt of Tears of Steel. Under the original rules only 2.2 percent of pause times showed an ad: 29 of 69 scenes had a judge saying caution or unsafe, 10 more had Jev confidence under 0.8, and most of the rest missed the relevance bar against a home goods catalog. Short scenes with different top products also cancelled each other in the 1 second look-back. The author chose a looser policy so the demo shows ads.

## Decision
- Safety: an ad is held back for safety only when Jev and the Qwen judge both say unsafe. Caution, a single unsafe verdict, low confidence and category scores no longer block. Rules 2 and 5 always pass when judgments exist; their ids stay so `failed` lists keep their shape.
- Relevance floor in the schema drops from 60 to 50; `config/thresholds.json` sets relevance 50 and rule 3b judge fit probability 0.4.
- Look-back: when every scene in the 1 second look-back is an ad, the pause shows the current scene's product, even if earlier scenes had another product. A non-ad scene in the look-back still blocks.
- The evaluation guardrail (no ad on a time a person labeled unsafe) is reported as a warning and written to `docs/eval/report.md`, but no longer fails `pnpm eval` or CI.

## Consequences
- Tears of Steel: 16.1 percent of pause times show an ad (was 2.2), 20 of 69 scenes.
- The fixture's violent scene (Jev caution, Qwen unsafe) now shows an ad; the eval report lists it as an unsafe ad.
- The landing page no longer says either model can block an ad.
- Scenes analyzed before this change were tagline-gated under the old rule, so some new ad scenes show the product name instead of a tagline until the clip is analyzed again.
