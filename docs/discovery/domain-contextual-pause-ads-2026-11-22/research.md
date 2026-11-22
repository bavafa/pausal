---
title: 'Domain research: contextual pause ads in streaming video'
type: domain
status: draft
preset: standard
validation: normal
created: 2026-11-22
updated: 2026-11-22
---

# Contextual pause ads: desk research

Purpose: evidence base for Pausall Phase 1.
Audience: PM, reviewers.
Status: draft. Last updated: 2026-11-22. All sources accessed 2026-11-22. Raw digests are in `digests/`. General information, not legal advice.

**Decision served:** is contextual pause advertising a credible, safe and legally workable idea for a portfolio demo, and which data and standards can Pausall use.

## Summary
1. Pause ads are a live, growing format. Amazon announced interactive pause ads for Prime Video on 2025-09-30 [1]. Netflix said pause ads would be sold programmatically through partner DSPs from October 2026 [2]. Hulu described a contextual pause ad in 2019 [3].
2. All performance figures found are seller-run or industry-sponsored (for example Amazon with Omnicom, MAGNA with DIRECTV). No independent benchmark and no price figure was found [4][5]. Pausall therefore treats all pause-ad numbers as simulated assumptions.
3. No independent survey of annoyance with pause ads specifically was found. IAB Tech Lab's own commentator said he had seen no consumer data that users prefer them [6].
4. No current industry standard for avoiding sensitive scenes in video ads was confirmed. GARM was discontinued on 2024-08-09 [7]. Pausall writes its own suppression policy.
5. Several vendors sell scene-level contextual tagging. All claims are vendor claims without benchmarks [8][9][10][11].
6. Licences: ABO is CC BY 4.0 [12] and Wikidata main data is CC0 [13]. The IAB taxonomy file licence could not be confirmed [14]. Criteo datasets are non-commercial and share-alike, so they are not used [15].

## 1. Pause ad format
| Platform | What is publicly stated | Confidence |
|---|---|---|
| Prime Video | Interactive pause ads, add to cart or request info, US, DE, ES, FR, IT, UK; managed-service advertisers via Amazon DSP; no targeting detail on the page [1] | High |
| Netflix | Programmatic pause ads through partner DSPs from October 2026; income and household-composition targeting being added [2]. Earlier announcements are from search summaries only | High for [2], low for the rest |
| Hulu | 2019 press release: pause ad with contextually relevant messaging, Coca-Cola and Charmin as beta partners [3] | High |
| Peacock, Max | Variety, 2023: Peacock customizes copy from user data; Max used one ad per session and none in mature content [16] | Medium, dated |
| YouTube, Roku, Disney+ | YouTube rollout and Roku patent are low confidence; Disney+ not verified | Low |

Finding: no pricing, CPM or independent performance data was found for any platform.

## 2. Performance and sentiment
- Amazon and Omnicom, reported 2026-10-16: 92 percent visual attention for pause ads against 87 percent for 30-second video, from 183 viewers and 574 exposures. This is a vendor claim from the format's seller [4].
- MAGNA and DIRECTV, 2025-07-21: 81 percent of viewers say they pause to avoid missing content, and receptivity ranges from 59 percent (Boomers) to 76 percent (Millennials). No sample size is given [5].
- AdExchanger, 2025-06-06: buyers and sellers expect growth, but the IAB Tech Lab speaker said he had not seen consumer data showing users prefer pause ads [6].
- Streaming ads in general annoy many viewers (for example a YouGov result of 43 percent who would stop using a service), but this is not pause-specific and is low confidence (search summary only).

## 3. Brand safety and standards
- GARM was discontinued by the WFA on 2024-08-09 [7]. Details of its categories come from search snippets only (low confidence).
- IAB Content Taxonomy 3.1 (December 2024) is the latest listed version [14]. The page lists no sensitive-content categories. IAB "SCD flags" were not followed and remain a lead.
- Not found: a current industry standard for sensitive-content avoidance in video ads. This supports writing a project-specific policy and testing it.

## 4. Privacy (general information)
- California AG: "sharing" for the opt-out right refers to cross-context behavioral advertising [17].
- FTC COPPA rule finalized 2025-01-16 requires separate opt-in parental consent for disclosing children's data to third parties for targeted advertising [18]. Compliance dates conflict between secondary sources. Confirm in the Federal Register.
- Not confirmed: that contextual ads need no consent in the EU or UK. The CNIL and ICO pages read do not say so explicitly. Pausall stores no personal data and uses no tracking, which is a design choice, not a legal conclusion.

## 5. Competitors and alternatives
| Vendor | What it publicly says | Class |
|---|---|---|
| Brightcove | Scene-level IAB 3.1 categories passed to ad server [8] | Vendor claim |
| Bitmovin | Scene metadata, mood tags and IAB categories during encoding [9] | Vendor claim |
| Google Cloud | Reference pipeline for scene detection and ad break placement [10] | Vendor claim |
| Anoki, Viant | Scene-level CTV targeting [11] | Vendor claim |
| Product placement (Mirriad, Rembrand) | Low confidence, search summaries only | Vendor claim |

Gap Pausall can speak to: none of these sources publish accuracy, suppression error rates or an explanation shown to the viewer. This is an observation about what was found in public sources, not a claim about what the vendors do.

## 6. Licences
See `../../data-sources.md`.

## Open questions and leads
IAB SCD flags; the primary GARM PDF; EDPB text; Federal Register COPPA dates; other US state laws; the original Amazon and Omnicom study; Etsy API terms.

## Sources
[1] https://advertising.amazon.com/resources/whats-new/engage-viewers-with-interactive-pause-ads (Amazon Ads, 2025-09-30)
[2] https://www.advanced-television.com/?p=292735 (Advanced Television, 2026-09)
[3] https://press.hulu.com/pressrelease/hulu-unveils-new-pause-ad-experience/ (Hulu, 2019-01-31)
[4] https://marketingreport.one/news/omnicom-amazon-measure-pause-ad-power.html (Marketing Report, 2026-10-16)
[5] https://www.directv.com/insider/magna-media-trials-directv-advertising-pause-ads/ (DIRECTV Advertising, 2025-07-21)
[6] https://www.adexchanger.com/ctv-roundup/iab-tech-lab-says-advertisers-are-excited-about-pause-ads-but-are-users/ (AdExchanger, 2025-06-06)
[7] https://wfanet.org/knowledge/item/2024/08/09/wfa-discontinues-garm (WFA, 2024-08-09)
[8] https://studio.support.brightcove.com/ai-features/content-suite/contextual-advertising.html (Brightcove)
[9] https://bitmovin.com/blog/ai-scene-analysis-vod-workflows/ (Bitmovin, 2025-06-10)
[10] https://cloud.google.com/blog/topics/developers-practitioners/use-ai-powered-scene-detection-for-more-effective-ad-placement (Google Cloud, 2025-01-07)
[11] https://www.beet.tv/2025/12/scene-level-targeting-brings-ais-contextual-revolution-to-ctv.html (Beet.TV, 2025-12-09); https://www.viantinc.com/insights/blog/ctv-scene-level-targeting/ (Viant, 2026-08-06)
[12] https://amazon-berkeley-objects.s3.amazonaws.com/index.html (ABO)
[13] https://www.wikidata.org/wiki/Wikidata:Licensing
[14] https://iabtechlab.com/standards/content-taxonomy/ and https://github.com/InteractiveAdvertisingBureau/Taxonomies
[15] https://ailab.criteo.com/criteo-uplift-prediction-dataset/
[16] https://au.variety.com/2023/tv/news/pause-ads-hulu-max-peacock-streaming-11601 (Variety, 2023-10-24)
[17] https://oag.ca.gov/privacy/ccpa (California AG)
[18] https://www.ftc.gov/node/87237 (FTC, 2025-01-16)
