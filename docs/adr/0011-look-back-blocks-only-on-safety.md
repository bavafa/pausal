# ADR 0011: The look-back blocks only on safety outcomes; relevance threshold 60

Status: accepted. Date: 2026-11-25. Amends AD-16 and ADR 0009.

## Context
A pause also checks every scene that ended less than 1 second before it, so a quick cut cannot land an ad. Any non-ad outcome there blocked the ad, including "nothing fits". In Tears of Steel, 1-second scenes such as the casual shoes at 100 s (relevance 68, a paid bid, brand safe) never showed their ad because the scene before them had only a weak match.

## Decision
- Earlier scenes in the look-back block only with a safety outcome: sensitive scene or analysis unavailable. A neighbour's "nothing fits" or "no active campaign" no longer blocks. The current scene's own reason still applies.
- `config/thresholds.json` sets relevance 60 (the schema floor stays 50).
- The landing page explains the trade-off: a higher relevance bar means more relevant ads, shown less often.

## Consequences
- Tears of Steel: 9.7 percent of pause times show an ad (10 of 69 scenes), up from 5.3 percent at relevance 65 with the old look-back.
- The safety protection of the look-back is unchanged.
