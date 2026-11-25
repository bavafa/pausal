# Plan: video uploads

Status: draft for the author's approval, 2026-11-24. Turns on PRD F8 (FR-18 to FR-22), which the first release left as a library seam (AD-13).

## What the visitor sees

1. On the landing page, a second button next to "Try a clip": "Use your own video".
2. A short notice (FR-21): you must own the video; it is not kept; DRM-protected files do not work; a text description of the clip goes to Jev and to Alibaba Model Studio (Qwen). One checkbox, then a file picker.
3. The browser checks the file: MP4, MOV or WebM, at most 5 minutes and about 100 MB (FR-20, raised from 2 minutes on 2026-11-24 to match FR-1). A clear message if it fails.
4. The video starts playing at once from the visitor's own file. The scene panel says "Analyzing the first scenes…" until the first 20 seconds are done (FR-22), then fills in. Pauses work as on the sample clips; a pause on a scene that is not analyzed yet says "No ad here: analysis unavailable."
5. Nothing is saved. Reloading the page drops the results.

## How it works

```
Browser                                  Relay (small Node server)                 Model APIs
-------                                  -------------------------                 ----------
read file, play from a blob URL
sample 1 frame/s at 512 px  ─┐
extract audio, 16 kHz mono  ─┼─ chunk 1 (0 to 20 s) ──▶ check limits and cost cap
                             │                           analyzeClip (existing)  ──▶ Qwen: describe, speech, embed, tagline
                             │                                                   ──▶ Jev: judge
                             │                           catalog index in memory
                             │  ◀── analysis + products ─┘ (streamed per chunk)
                             └─ chunk 2, 3, … ─────────▶ same
decide (existing, pure) in the browser
resolvePause and rankAt as today
```

### Browser side (FR-18)
- Frames: a hidden `<video>` and a canvas step through the file at 1 frame per second, scale to 512 px wide, encode JPEG, and compute the change from the previous frame (the `diff` that `segment` already uses).
- Audio: Web Audio decodes the file and resamples to 16 kHz mono WAV. Speech boundaries come from a simple loudness check, the same rule the CLI applies with ffmpeg's silence detection, so scenes are cut the same way.
- The file itself never leaves the browser. Only frames and audio are sent, chunk by chunk, first 20 seconds first.
- When results arrive, the browser runs the existing `decide` step (pure code, no file system) to turn `analysis` into `decisions`, then plays as on the sample clips.

### Relay
The browser cannot call Qwen and Jev directly: the API keys would sit in the page for anyone to copy and spend. The relay holds the keys and runs the analysis. It is a small Node 26 service that imports `@pausal/pipeline` as it is, because `analyzeClip` already takes frames, audio and models as plain data (AD-13). Its jobs:

- Accept one chunk of frames and audio, run `analyzeClip` on it, and stream the scenes back (server-sent events).
- Keep the catalog in memory: the 20,000 item slice (8 MB) and its vectors (39 MB). Return the product data for every product a scene picks.
- Product images: the site on GitHub Pages only holds images for products in the sample clips. The 256 px images for the whole slice (an estimated 300 MB) go to Cloudflare R2 (free up to 10 GB, no download fees), and the relay returns their URLs.
- Limits: 3 analyses per visitor per day (keyed by a salted hash of the IP, kept in memory for 24 hours), a bot check (Cloudflare Turnstile, free) before the first chunk, and a daily spend cap through the existing `Ledger`. When the cap is reached, uploads close for the day with a plain message.
- Privacy (FR-19): frames, audio and transcripts are held in memory for one request and dropped. No request bodies in logs. Only the numeric results are cached by content hash for one hour, so the same file twice costs nothing.
- CORS allows only the Pages site and localhost.

### Where the relay runs
Needs a host that runs a Node container with about 512 MB of memory and keeps a secret. Options, in order of preference:

| Host | Cost | Notes |
|---|---|---|
| Fly.io | about 2 to 5 USD a month for one small machine, can sleep when idle | Docker image, secrets, scales to zero; first request after sleep takes a few seconds |
| Render | free tier sleeps after 15 minutes; 7 USD a month always on | Simple from GitHub, slower cold start |
| Hugging Face Spaces (Docker, CPU basic) | free | Secrets supported; sleeps when idle and wakes slowly; the Space page is public |
| The author's Mac | free | Good for building and testing; not reachable by visitors |

Model cost per 5-minute upload: roughly 5 to 15 cents, not yet measured (describe, two judges per scene, speech, embeddings, taglines). The daily cap bounds the total.

## Build order (stories)

1. Relay skeleton: Node server around `analyzeClip`, catalog loaded at start, one endpoint per chunk, SSE stream, runs on localhost. Tests with a recorded fake model client.
2. Browser extraction: frames, diff and audio from a file, with tests on a short generated video (the fixture clip).
3. Upload page: notice, picker, limit checks, playback from the local file, "Analyzing the first scenes…" states (EXPERIENCE already describes them).
4. Results in the watch screen: merge streamed scenes, run `decide` in the browser, products and images from the relay.
5. Limits and privacy: per-visitor count, Turnstile, daily cap, no-log check, hash cache.
6. Deploy the relay to the chosen host, point the Pages build at it, end-to-end check with one of the AI clips, and a browser test that mocks the relay in CI.
7. Docs: PRD F8 marked on, a new ADR for the relay and host, AD-13 updated, `docs/data-sources.md` and the attribution page mention third-party processing of uploads.

Stories 1 and 2 can be built in parallel. Rough size: 2 to 4 sessions in total.

## Decisions for the author
- Host: Fly.io (recommended), Render, or local only for now.
- Limits: 5 minutes and 100 MB (decided 2026-11-24); keep 3 per day?
- Daily spend cap: suggested 2 USD.
