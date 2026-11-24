---
title: 'Story 5.5: Browser check for speed and no network'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The 500 ms pause and the no-network rule were assumed, not enforced (FR-12, NFR1, AD-1, AD-23).

**Approach:** Playwright (`@playwright/test` 1.65.1) serves the production build with `vite preview`, opens the fixture clip in headless Chrome, and pauses at 7 times (each outcome, 50 ms and 300 ms after a boundary inside the 1 s look-back). Each overlay must appear within 500 ms and contain what `resolvePause` gives for the paused frame. After load, the only allowed request is the clip video itself (range requests).

</frozen-after-approval>

## Implementation Notes

- Chrome channel, not Playwright Chromium, because the clips are H.264; GitHub Ubuntu runners ship Chrome. CI runs `pnpm browser` after the build.
- The first run found two real late requests, both fixed: the Raleway 600 font loaded only when the ad card first showed (now `document.fonts.load` for every bundled face at start), and a preloaded product image was fetched again because the `Image` object was not kept (now kept in a map).
- The pause log checks from the Epic 3 retro (item 12) are not in this test yet.

## Review Triage Log

Layers ran inline in this session (no subagents). Epic 5 ran without check-ins at the user's request; specs were self-approved.

| Finding | Verdict | Evidence / route |
|---|---|---|
| Video range requests are allowed after load | low | Accepted: the video is the content being played; AD-1 is about API and model calls. |
| Epic 3 retro item 12 (pause log rows) not covered | medium | Left open in sprint-status. |
