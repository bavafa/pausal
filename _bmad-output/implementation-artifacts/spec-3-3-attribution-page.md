---
title: 'Story 3.3: Attribution page'
type: 'feature'
created: '2026-11-23'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app does not credit the product catalog or say where its data comes from (FR-17, AD-12, UX-DR14).

**Approach:** Add a `#/attribution` route with a static page reachable from a link at the bottom of the clip picker. It shows the Amazon.com credit for Amazon Berkeley Objects (ABO), the Collins et al. CVPR 2022 citation with an arXiv:2110.06199 link, a link to the CC BY 4.0 licence, a statement of changes (a slice of the catalog, resized images, generated text), a line that Amazon does not endorse the project, and a line that the sample clips are AI-generated. A Back link returns to the picker. Wording follows `docs/data-sources.md`. The page has no state and makes no request; its two outside links open only when followed.

</frozen-after-approval>

## Implementation Notes

- Route `#/attribution` added to `route.ts` (test row in `clips.test.ts`); `App` reads `clipId` only on clip and product routes; `AttributionPage.tsx` is new; the picker has an "Attribution" link at the bottom.
- Wording follows `docs/data-sources.md`. The citation is shortened to "Collins et al." with the paper title and an arXiv link. The ABO licence file itself is still unopened (open item in the resume notes, before the real catalog slice).
- Browser check at 1280 px: the picker link opens the page, Back to clips returns to the picker; every request after a fresh load returned 200.

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Following an outside link in the same tab reloads the app on return and wipes the session tally | medium | Patched: outside links open in a new tab with `rel="noreferrer"`. |
| The statement of changes describes the real ABO slice while the app still shows fixture products | low | Rejected: the fixture products carry their own "not a real listing" attribution; Epic 4 brings the ABO slice. |
| The page cites ABO as CC BY 4.0 without the licence file having been opened | low | Rejected here: already an open item in the resume notes (Do first, item 4), to settle with the catalog slice in Epic 4. |
