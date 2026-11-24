# Jev: what it can do and where it fits

Purpose: decide where TypeSafe's Jev model belongs in the Pausal pipeline.
Audience: the author.
Status: draft. Last updated: 2026-11-22. Facts come from the public TypeSafe docs and legal pages read on 2026-11-22 (listed at the end). Vendor claims are marked. Not legal advice.

## What Jev is (documented)
- One endpoint, `POST https://api.typesafe.ai/v1/systemone`, with a Bearer key. Request: `model`, `state` (text, object or array), `questions` (named, run in parallel on the same state). TypeScript and Python SDKs exist.
- Four answer types:
  - **Choice:** one option from 1 to 255, with a probability for every option and a confidence value.
  - **Score:** a rubric of 1 to 10 levels (use at least 2), returning a fractional position, per-level probabilities and confidence.
  - **Noul:** the probability (0 to 1) that a yes/no statement is true.
  - **Box:** a region in an image.
- It does not write text, lists or nested objects. Confidence measures how concentrated the probabilities are, not how likely the answer is right.
- Input is text. Still images (PNG, JPEG) are possible only with an opt-in header, and the docs call that feature not production-ready. Video and audio are not supported.
- Context: 64k tokens per request (262k with a long-context header, slower and less accurate).
- Price (vendor figure): $0.042 per million input tokens, output free. Rate limits are not published: checked 2026-11-23, the console (Usage, Billing, API keys, Settings) shows none, and the errors page only says a `429` means back off and retry (the SDKs retry with exponential backoff by default). Questions in one request run in parallel, so one scene is one request. Request body limit 32 MiB. No latency SLA. Latency claim of 70 to 500 ms is self-measured.
- Documented weak spots: Choice leans to the first option; accuracy falls with large irrelevant state; adversarial text in the input can move answers; weak at counting and math.

## Fit with the Pausal pipeline
Pipeline: frames and speech, then a vision-language model (VLM) and speech to text, then retrieval of about 200 products, then judging, then the list and the pause decision.

| Job | Fit | How |
|---|---|---|
| See the video, hear the dialogue | None | Needs a VLM and speech to text before Jev |
| Write the scene description and the one-line "why this product" | None | Jev cannot write text. The VLM or an LLM writes the description. The reason line is a template filled from the matched attributes, or an LLM call |
| Scene type (kitchen, office, fight, action) | Strong | Choice over a fixed label list built from IAB categories |
| Sentiment | Good | Score with a 5-level rubric (very negative to very positive). We map the position to -1..+1 in our own code. The docs advise against reading exact magnitudes between levels, so we report it as a bucketed score |
| Brand safety and suppression | Strongest fit | One Noul per category (violence, death or grief, sexual content, medical trauma, child-focused, intense dialogue). Our code applies the thresholds and the "unknown means no ad" rule. Calibrated probabilities suit a guardrail |
| Judge candidate products | Good | One Noul per scene and product pair ("this product fits this scene"), 50 to 100 questions per request, times 100 for the 0 to 100 relevance score. Alternative: one Choice over up to 255 candidates, shuffled to offset the first-option lean |
| List stability | Helpful | Probabilities give a natural margin for hysteresis |

Recommendation: Jev is the scene judge and the suppression classifier, behind a `SceneJudge` interface. A VLM and speech to text sit in front of it. The evaluation compares Jev with a plain LLM judge, as planned.

## Cost (estimate, not measured)
An upper bound for a 2-minute clip: 24 scenes, 50 product questions each, about 1,000 input tokens per question is 1.2 million tokens, or about $0.05 at the listed price. If the state is billed once per request it is far less. The VLM is likely the larger cost. Measure it in Phase 6.

## Risks and conflicts to handle
1. **Prompt injection.** Dialogue or on-screen text in an upload is text that Jev reads when it classifies safety. The docs say adversarial text can move answers. Mitigation: classify from the VLM description, not the raw transcript, and keep a second signal. Never let one probability alone unlock an ad.
2. **Upload notice.** Pausal will not keep video, frames or audio, but Jev receives text derived from them. The terms say TypeSafe has no obligation to store customer data, give no retention period, and let it keep derived "summary statistics and classifications" for telemetry. Zero data retention is offered only to enterprise customers. The upload notice must say that a text description is processed by a third-party service, and the rights checklist needs this line.
3. **Customer responsibility.** The terms make the customer responsible for having the rights to the input. This is another reason to keep uploads behind the feature flag.
4. **Early access.** No SLA, rate limits not visible without login, a pricing that the vendor says it cannot prove is not subsidised. Keep the LLM judge as a working fallback.
5. **Marketing versus docs.** The blog says Jev "can't hallucinate", while the docs list failure modes. We trust the docs and our own evaluation.
6. **Dates.** The blog body is dated 2026-09-15 and its page metadata says 2026-11-16. The privacy policy is dated 2025-11-19.

## Not read
Rate limits (console), the changelog, the trust center and subprocessor list, the Choice, Noul and Box primitive pages, and any calibration numbers. Check these before the architecture is locked.

## Sources
https://docs.typesafe.ai/api/system-one.md, https://docs.typesafe.ai/models.md, https://docs.typesafe.ai/images.md, https://docs.typesafe.ai/model-jaggedness.md, https://docs.typesafe.ai/confidence.md, https://docs.typesafe.ai/api/errors.md, https://typesafe.ai/blog/introducing-system-one-models-and-jev, https://typesafe.ai/legal/mca, https://typesafe.ai/legal/privacy-policy, https://typesafe.ai/legal/data-processing, https://typesafe.ai/enterprise (all accessed 2026-11-22)
