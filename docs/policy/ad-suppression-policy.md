# Ad suppression policy

Purpose: rules that decide when Pausall shows a pause ad and when it shows none.
Audience: the author and anyone building or evaluating the system.
Status: draft. Last updated: 2026-11-22.

No industry standard for pause-ad suppression is confirmed (GARM was discontinued on 2024-08-09), so this policy is written and tested by this project. All ads, campaigns and numbers are simulated.

## Principle
When unsure, show no ad. An ad is shown only when every rule below passes.

## Decision rules
An ad is shown on pause only when all of these hold:
1. The scene brand-safety verdict is safe, with confidence at or above the safety threshold.
2. No sensitive category (below) is flagged for the scene.
3. The top product has a relevance score at or above the relevance threshold.
4. The top product has an active simulated campaign.
5. A second signal agrees with the first. One model probability alone never unlocks an ad.
6. The analysis for the scene finished without error.

If any rule fails, the viewer sees the frozen frame and one reason.

## Sensitive categories
Each is judged separately by the scene judge. A flag in any one blocks the ad.
- Violence
- Death or grief
- Sexual content
- Medical trauma
- Child-focused content
- Intense dialogue

Caution verdicts also block the ad in this first version.

## No-ad reasons
| Reason shown | Cause |
|---|---|
| Sensitive scene | Rule 1, 2 or 5 failed |
| Nothing fits well | Rule 3 failed |
| No active campaign | Rule 4 failed |
| Analysis unavailable | Rule 6 failed |

If several rules fail, the first matching row in this order is shown.

## Tagline rules
- The tagline is generated only for scenes that pass the safety rules (rules 1, 2, 5 and 6), and shown only when an ad is shown.
- It may use only facts present in the product data and the scene description. It must not add health, safety, price or quality claims the data does not support.
- It is checked against the product data before display. A tagline that fails the check is replaced by the product name alone.
- It must not mention the sensitive details of the scene.

## Prompt injection
Dialogue and on-screen text are untrusted. The scene is classified from the generated scene description, not from the raw transcript. Text in the video that tries to give instructions never changes a verdict.

## Thresholds
Starting values, tuned in the evaluation. [ASSUMPTION] None is validated.
- Safety confidence threshold: 0.8
- Relevance threshold: 60 out of 100
- Product list size: 10

## Evaluation
- Guardrail: ads shown in scenes a human labeled unsafe is zero on the evaluation set.
- Each category has labeled test scenes, including clips that should and should not trigger it.
- Failures are published with the results.
