# ADR 0010: Uploads through a relay on Vercel Hobby

Status: accepted. Date: 2026-11-25. Turns on PRD F8 (FR-18 to FR-22); amends AD-13. Plan: `docs/upload-plan.md`.

## Context
Visitors can now analyze their own video (up to 3 minutes and 100 MB). The browser cannot hold the Qwen and Jev keys, and the web app may not import the pipeline (AD-23). The author wanted a free host without the slow wake-up of Hugging Face Spaces.

## Decision
- The browser reads the file locally: one 512 px JPEG per second with a 32x18 grey change score, and 16 kHz mono PCM. It sends them in 20 s chunks, up to 3 at a time, to `POST /api/chunk`.
- The relay (`services/relay`, one bundled ES module) runs `analyzeChunk` in `@pausal/pipeline`: silence detection and per-scene transcription from the PCM, then `analyzeClip` and `deriveDecisions` on the chunk. It answers with chunk-local decisions and the products they name, with images from R2.
- The browser validates each answer with `validateDecisions` and `validateProduct`, shifts it to clip time and merges it; time not yet analyzed has no scene, so a pause there says analysis unavailable.
- Host: Vercel Hobby (free, non-commercial, about 1 s cold start, 300 s per request). The catalog slice and vectors load from R2 once per warm instance.
- Limits: 3 uploads per visitor per day (salted hash of the IP), 2 USD of model spend per day, origins limited to the Pages site and localhost. Usage is one R2 object per day (`usage/<date>.json`), read-modify-write.
- Nothing from a request body is logged or stored.

## Consequences
- A 3-minute upload costs about 1 cent and is analyzed in roughly a minute and a half.
- Relevance history resets at each 20 s chunk boundary; products found for uploads have no short name.
- Two chunks finishing together can undercount the daily spend by one chunk.
- No bot check yet (Turnstile planned); the daily cap bounds the cost of abuse.
- `usage/` sits in the public bucket; it holds only salted visitor hashes, upload ids and a total.
