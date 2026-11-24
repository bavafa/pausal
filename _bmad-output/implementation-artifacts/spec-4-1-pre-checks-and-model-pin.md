---
title: 'Story 4.1: Pre-checks and model pin'
type: 'chore'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The pipeline needs a pinned VLM, text and embedding model, and data it may use, before the first real run.

**Approach:** Read the ABO licence and the Model Studio data terms (done earlier the same day, recorded in `docs/data-sources.md`). `pnpm vlm-check <video>...` sends one 6-frame request per clip to `qwen3.7-flash` and `qwen3.7-plus`, prints latency, tokens, cost and the description, and checks whether a frame list is accepted as a video part. Pin the result in `config/pipeline.json` and the spine Stack table.

</frozen-after-approval>

## Implementation Notes

- Run on 2026-11-24 on 6 real frames from the middle of each of the 4 test clips (see Story 4.3).
- Latency: flash 2.5 to 5.3 s, plus 3.1 to 3.7 s. Input about 940 tokens for 6 frames at 512 px. Cost per request: flash about $0.00004, plus about $0.0005 (13 times more).
- Quality: both described setting, people, actions and threat cues equally well (a gun pointed in a bar, a rappel down a cliff, a man at an iMac). Flash quoted an engraving on a gun word for word with the looser test prompt; plus paraphrased it. The pipeline describe prompt forbids quoting.
- A frame list sent as a `video` content part was accepted by flash for all 4 clips. The pipeline keeps sending frames as images, which works and keeps per-frame control.
- Pinned: VLM, text model and Qwen judge `qwen3.7-flash`; speech `qwen3-asr-flash`; embeddings `text-embedding-v4` at 512 dimensions; Jev `jev-1.14.0`. Total cost of the check $0.0023.
- Prices for `text-embedding-v4` and `qwen3-asr-flash` are not on the Model Studio pages read; the config values are estimates.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Flash quoted on-screen text in the test | medium | Routed: checked on the real run output with the stricter prompt (Story 4.9 notes). |
