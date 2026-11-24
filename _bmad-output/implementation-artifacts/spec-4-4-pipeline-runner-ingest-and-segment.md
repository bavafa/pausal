---
title: 'Story 4.4: Pipeline runner, ingest and segment'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no repeatable, cost-capped way to turn a clip into an `analysis` file (AD-13, AD-21, AD-22).

**Approach:** `pnpm analyze <clip-id>` reads the manifest, checks the clip ID is the video hash prefix and the duration matches, samples 1 fps frames at 512 px with ffmpeg, measures frame change on 32 by 18 grey frames, finds speech boundaries with ffmpeg `silencedetect` when the manifest has dialogue, and calls the `analyzeClip` library. The library takes data in and returns an `analysis` object; only the CLI touches files. Keys come from `.env` only.

</frozen-after-approval>

## Implementation Notes

- Library: `analyze.ts` (`analyzeClip`), `segment.ts`, `judge.ts`, `catalog.ts`, `call.ts` (ledger, cost cap, `postJson` with timeout and exponential backoff on network errors, 429 and 5xx). CLI: `analyze-cli.ts`. Pipeline settings and pinned model names by role live in `config/pipeline.json` (cost cap $2, timeout 90 s, 3 retries).
- Segmenting: cut where the mean grey difference to the previous frame is at least 0.1, at speech starts and ends, and at the 8 s cap (an over-long scene is split into equal parts). Cuts under 1 s apart are merged so no sliver scenes. A first try at 0.2 missed hard cuts on the smoke clip (differences 0.12 to 0.17). Tune on the real clips.
- Speech: `qwen3-asr-flash` through the compatible-mode endpoint, one call per scene with speech, WAV at 16 kHz. Spans that silence detection marks as fully silent skip the call. The transcript is passed to describe only and never stored (test checks the analysis JSON does not contain it). A failed or empty transcript where speech was detected fails the scene; a manifest with dialogue but no audio track stops the run.
- A stage failure becomes `status: error` with `{ stage, message }`; the cost cap error aborts the run and nothing is written. The run prints tokens and cost per stage.
- Smoke runs (24 s and 12 s test clips built from catalog photos, a rendered text frame and `say` speech): about $0.001 and 20 to 30 s each.
- Not built: `models` stores pinned names by role; token counts and cost per stage are printed but not stored in `analysis` (the schema has no field). Story 4.9 records the totals in the docs.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| A failed transcription returned an empty transcript and the scene was judged without its speech | high | Patched: the error fails the describe stage. |
| A dialogue manifest with no audio track was analysed as silent | high | Patched: the run stops. |
| Silent spans made the speech model fail with "audio is empty" | medium | Patched: fully silent spans skip the call; silence times are rounded to ms like cuts. |
| A speech boundary 55 ms after a frame cut made a 55 ms scene | medium | Patched: cuts under 1 s apart are merged. |
| Node type stripping rejects TypeScript parameter properties | low | Patched: plain fields. |
