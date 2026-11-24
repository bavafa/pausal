---
title: 'Story 4.9: Real analysis replaces the fixture'
type: 'feature'
created: '2026-11-24'
status: 'review'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The demo should run on real analysis, not the hand-authored fixture.

**Approach:** `pnpm analyze` each clip, `pnpm abo products` (product files, images and simulated campaigns for referenced products), `pnpm decide`, and hide the fixture from the picker while keeping it as a test fixture.

</frozen-after-approval>

## Implementation Notes

- Done on the test clips on `local/test-clips` (2026-11-24). Model cost: $0.0074, $0.0130, $0.0062 and $0.0065 for the four clips, $0.033 in all, about $0.005 per clip minute, far under the $2 cap. Outcomes: action short 24 sensitive and 1 nothing fits; film bar scene 52 sensitive and 3 unavailable; street short 8 ads, 6 nothing fits, 3 sensitive, 1 unavailable; office clip 12 ads and 10 nothing fits.
- `pnpm abo products` wrote 470 product files and 5.2 MB of images and kept 473 campaigns. Campaigns are simulated: bid 50 to 150 cents from a hash of the product ID, budget 200 times the bid, 1 in 10 inactive.
- The picker shows only manifests whose `attributionKey` is not `fixture`; the fixture stays reachable by URL for tests. On `main`, with no real clips yet, the picker is empty, so `main` must not be pushed until the final clips land.
- Browser check (dev server): the picker shows the 4 test clips and no fixture; pausing the office clip at 18.9 s shows a real ABO desk with its image, tagline and "Shown because this scene matches office". Ranking hold during 30 s of playback: the first top product stayed through a scene change and let go after 5 s; `rankAt` releases on an outcome change at the right time, but the list updated about 0.9 s late in the hidden preview pane (throttled frame callbacks). Story 5.5 measures this in a visible tab.
- Still to do with the final clips: rerun the steps on `main`, commit, push, check the deployed site.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Image paths in `images.csv` ended in a carriage return, so tar found no images | high | Patched: split on CRLF; members passed with `-T`. |
| Qwen judge sometimes returned `false` instead of a probability (5 scenes) | medium | Patched: prompt shows numeric example; reruns had none. |
| Qwen judge's unknown scene type ("outdoors") discarded its safety answer | medium | Patched: only the label is dropped; Jev's label is used. |
| YouTube end screen ("subscribe", "watch more") is flagged as instructions | low | Accepted: fails closed as analysis unavailable; prompt narrowed, still flagged. |
| One description quotes a script title on screen | low | Accepted for now: titles only; listed for the Epic 5 failure report. |
