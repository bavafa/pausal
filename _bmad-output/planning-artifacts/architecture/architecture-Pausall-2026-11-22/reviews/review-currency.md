# Currency review: Architecture Spine and ADRs

Date: 2026-11-22. Scope: ARCHITECTURE-SPINE.md (Stack, AD-5, AD-6, AD-11, AD-12) and ADRs 0002, 0005, 0006, 0007. Method: npm registry JSON, vendor docs and live HTTP checks. Read-only review; no project file was changed.

## Verdict

The architecture still fits, but the Qwen model names in the Stack table are stale: `qwen3-vl-flash` was scheduled to stop serving on 2026-10-10 and must be replaced before the first pipeline run. Everything else checks out, with one licence record to reconcile and one Jev pin to add.

## Findings

| # | Severity | Finding | Action |
|---|---|---|---|
| 1 | High | `qwen3-vl-flash` (all snapshots, incl. `-us`) is on Alibaba retirement notices dated 2026-07-06 and 2026-07-10, ceasing service 2026-10-10 00:00 UTC+08 ("subject to actual change time"). A GitHub issue cites a 2026-09-28 follow-up that terminates all scheduled models together on that date (secondary source, not confirmed). That date has passed. The US notice maps it to `qwen3.6-flash-us`. `qwen3-vl-plus` (2025-09-23 and 2025-12-19 snapshots) is on the US retirement list with `qwen3.7-plus` as replacement; it is not on the Beijing-style list and still has a Singapore price row, so its status is unclear. | Replace the Stack row. Candidates: `qwen3.7-flash` (cheapest) or `qwen3.6-flash` for description, `qwen3.7-plus` for a stronger safety judge. Confirm in the console model list that the chosen ID exists and accepts video or image lists before pinning. Update AD-5/AD-6 text only if it names a model (it does not). |
| 2 | Medium | Video input for the new models is not confirmed. The Model Studio release page lists qwen3.7-flash and qwen3.7-plus as "visual understanding" with video not stated. qwen3.8-flash and omni models mention long video. The vision doc confirms the mechanism: OpenAI-compatible `video_url` (file URL, `fps` 0.1 to 10, default 2) or a `video` image list (supported for Qwen3-VL and newer families), plus several images per request. | Describe stage should use pre-extracted frame lists at 1 fps (matches the deferred sampling question). Verify with one test call on the chosen model. |
| 3 | Medium | ABO licence record conflict. Official index page and the AWS Open Data registry say CC BY 4.0; the registry notes it was changed in 2023 from CC BY-NC. The Amazon Science blog and AWS Marketplace listing still say CC BY-NC 4.0. `docs/data-sources.md` records CC BY 4.0 and notes the licence file was not opened. | Keep CC BY 4.0, but open `LICENSE-CC-BY-4.0.txt` in the download and record that the older NC wording exists. Keep the attribution page. |
| 4 | Medium | Jev model name now known: `jev-1.14.0` (released 2026-10-14), alias `jev-latest` (SDK default) and `jev-preview` both point to it. Docs warn aliases move and change answers. Box needs 1.14; Choice, Noul, Score work on 1.13.0 and 1.14.0. Context 64k per request, 32k per question. | Pin `jev-1.14.0` in config (thresholds are tuned against one version). Record the model ID returned in each `analysis` file. |
| 5 | Medium | Jev rate limits are per organization (tokens and requests per second), numeric values only in the console; `429` and `529` need exponential backoff. Request body max 32 MiB, `TypeSafe-Danger-Zone-Images: true` header is required for image assets. No SLA is published. | Keep the Qwen fallback (ADR 0005). Check console limits before the first run. |
| 6 | Low | GitHub Pages: 1 GB site limit, 100 GB per month soft bandwidth, 10 builds per hour soft limit (not applied to custom Actions workflows), 10 minute deploy timeout. No per-file limit is stated. Range requests: live test returned `206` with `accept-ranges: bytes` and `content-range` from github.io hosting; an mp4 was not tested. | ADR 0006 is accurate. Re-test with the real clip after first deploy: `curl -r 0-1 -I <clip url>`. |
| 7 | Low | Node requirement. Vite 8.3.8 needs Node `^20.19.0 || >=22.12.0`. Node 27 is Alpha; LTS lines are 26, 24, 22 (the nodejs.org table shows end dates of Nov 2026 for all three, so the phase of each should be checked on the release schedule). The Jev JS SDK needs Node 22 or newer. | Pin Node 24 or 26 in `.nvmrc` and `engines`; do not use 22 beyond its end date. |
| 8 | Low | Alibaba region and data handling: Singapore, US (Virginia) and Beijing each have a compatible-mode base URL (`https://{WorkspaceId}.<region>.maas.aliyuncs.com/compatible-mode/v1`). The selected region stores request data; inference runs in the chosen deployment scope (US region offers Global and US). Free quota (1M tokens, 90 days) applies in Singapore only. Whether data is used for training was not found. | Choose Singapore (free quota) or US with the US scope. Check the regional terms for training use before sending any non-sample content. Do not use Beijing. |
| 9 | Info | ffmpeg stable is 9.1 "Gauss" (2026-11-20, two days old). | Pin a point release after the next patch, or use the distro build; the pipeline only needs basic extraction. |
| 10 | Info | Stack row "pnpm workspace" and "Vite major disagreement": the disagreement is resolved below. `@vitejs/plugin-react` 6.3.0 requires Vite 8. `@tailwindcss/vite` 4.3.5 supports Vite 5 to 8. | Pin as in the table. |

## Confirmed current values (pin these)

| Item | Value | Source |
|---|---|---|
| Vite | 8.3.8 (Node `^20.19.0 \|\| >=22.12.0`) | https://registry.npmjs.org/vite/latest |
| @vitejs/plugin-react | 6.3.0 (peer vite ^8) | https://registry.npmjs.org/@vitejs/plugin-react/latest |
| React | 19.3.1 | https://registry.npmjs.org/react/latest |
| Tailwind CSS | 4.3.5 | https://registry.npmjs.org/tailwindcss/latest |
| @tailwindcss/vite | 4.3.5 (peer vite 5 to 8); setup is `@import "tailwindcss"` plus the plugin | https://registry.npmjs.org/@tailwindcss/vite/latest , https://tailwindcss.com/docs/installation/using-vite |
| pnpm | 12.21.0 (Node >=18) | https://registry.npmjs.org/pnpm/latest |
| TypeScript | 7.0.2 | https://registry.npmjs.org/typescript/latest |
| Node | LTS 26 (26.13.1), 24 (24.22.3), 22 (22.23.5); 27 alpha | https://nodejs.org/en/about/previous-releases |
| ffmpeg | 9.1 "Gauss", 2026-11-20 | https://ffmpeg.org/download.html |
| GitHub Pages limits | 1 GB site, 100 GB/month soft, 10 builds/hour soft, 10 min deploy | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Jev model | `jev-1.14.0` (alias `jev-latest`), $0.042 per million input tokens, output free | https://docs.typesafe.ai/models.md |
| Jev endpoint | `POST https://api.typesafe.ai/v1/systemone`, Bearer key | https://docs.typesafe.ai/api/system-one.md |
| Jev limits and errors | 32 MiB body; 400, 401, 413, 415, 422, 429, 529; backoff | https://docs.typesafe.ai/api/errors.md |
| Jev JS SDK | `@typesafe-ai/sdk` 0.7.0, Node 22+, ESM and CJS, typed answers; no browser support stated | https://docs.typesafe.ai/sdk/javascript.md |
| Jev weak spots | Adversarial text can sway answers; first-option bias; literal reading | https://docs.typesafe.ai/model-jaggedness.md |
| Qwen compatible-mode URLs | Singapore, US Virginia, Beijing `maas.aliyuncs.com/compatible-mode/v1` | https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions |
| Qwen prices (per M tokens, Singapore) | qwen3.7-flash 0.03 in / 0.13 out (0 to 32K); qwen3.6-flash 0.25 / 1.5; qwen3.7-plus 0.4 / 1.6; qwen3.8-flash 0.15 / 0.47; qwen3-vl-plus 0.2 / 1.6 | https://www.alibabacloud.com/help/en/model-studio/model-pricing |
| Embeddings | `text-embedding-v4` and `qwen3.7-text-embedding`, $0.07 per M input tokens (Singapore, 1M free) | same pricing page |
| Qwen retirement | qwen3-vl-flash ceased 2026-10-10 | https://www.alibabacloud.com/en/notice/model_studio_notice_on_the_postponed_retirement_of_selected_legacy_models_7d0 , https://www.alibabacloud.com/en/notice/model_studio_notice_of_retirement_for_selected_legacy_models_7d9 |
| ABO licence | CC BY 4.0 (changed from CC BY-NC in 2023) | https://amazon-berkeley-objects.s3.amazonaws.com/index.html , https://registry.opendata.aws/amazon-berkeley-objects/ |
| GitHub Pages range test | `206`, `accept-ranges: bytes` | live curl, 2026-11-22 |

## Not confirmed

- Whether `qwen3.7-flash` or `qwen3.6-flash` accept video or `video`-type frame lists (the doc page was truncated before the model table).
- Alibaba data-use-for-training terms and exact per-frame token cost for the new models.
- Jev numeric rate limits and any latency guarantee (console only).
- Whether `qwen3-vl-plus` is still serving in the Singapore region.
- Official status of Node LTS phases (Active versus Maintenance).
- mp4 range requests on GitHub Pages for the real clips (hosting-level support is confirmed).

## Other notes

- Alibaba also lists a `decision-model-preview` (structured yes/no and scoring) in its recommended models. Worth one look as a Qwen-side judge, but it is a preview and not needed for the spine.
- The spine's statement "Jev with TypeScript SDK" is correct; `docs/discovery/jev-fit.md` already records the price and endpoint, which still match.
- Stack table suggested edit: replace "pin at scaffold" with the values above, change the Qwen row to a flash or plus model on the 3.6, 3.7 or 3.8 line, and the Jev row to `jev-1.14.0`.
