---
title: 'Clip picker in the Soft Calm style'
type: 'feature'
created: '2026-11-23'
status: 'done'
baseline_commit: 'fbae6c4'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `apps/web` renders one placeholder line. There are no design tokens, no fonts and no way to choose a clip.

**Approach:** Add Tailwind v4 with the Soft Calm tokens as CSS variables (light and dark by system setting), self-host Lora and Raleway, and render a clip picker from the validated manifests. Selecting a clip goes to a hash route that Story 1.7 fills with the watch screen.

## Boundaries & Constraints

**Always:** Tokens exactly as `DESIGN.md` (colors light and dark, radii 8, 14 and full, 4-based spacing, gutters 12 and 18 px). Fonts self-hosted, no request to a font CDN, Georgia and system-ui fallbacks. Manifests are read from `data/manifest/*.json` and each one passes `validateManifest`; an invalid manifest is left out of the list. Each clip shows its title and "AI-generated". One line explains the experiment. Text meets 4.5:1 in both modes. Docs: no em dashes, no contractions.

**Decisions (agent, user would not notice):** Manifests are bundled at build time with `import.meta.glob` (no fetch, so no request after load). Hash routes (`#/` and `#/clip/<clipId>`) because GitHub Pages serves one `index.html`. Fonts from `@fontsource/lora` and `@fontsource/raleway` 5.3.0 (latin subset, weights in use), the smallest way to self-host. Explaining line: "Pause a clip. An ad appears only when the scene fits. Every ad is simulated." Each clip is a link card with a 44 px minimum target. Page title "Pausall" as `h1`.

**Never:** No watch screen behavior (Story 1.7), no UI library, no router library, no analytics.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid manifests | fixture `000000000001` | one card, title and "AI-generated" | N/A |
| Invalid manifest | one fails validation | left out of the list | console warning naming the file |
| No valid manifest | empty list | one calm line "No clips yet." | N/A |
| Unknown clip route | `#/clip/zzz` | "Clip not found." and Back to clips | N/A |

</frozen-after-approval>

## Code Map

- `apps/web/src/main.tsx` -- placeholder render; replace with `App`.
- `apps/web/vite.config.ts` -- add `@tailwindcss/vite`; `base: "/pausall/"` stays.
- `packages/bundle-schema/src/manifest.ts` -- `validateManifest`, `Manifest` type. Reuse.
- `.oxlintrc.json` -- web may import `@pausall/policy` and `@pausall/bundle-schema` only; relative imports of `data/` are allowed.
- Tests run from the root `vitest run` (no config); keep web tests pure `.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/package.json`, `pnpm-lock.yaml` -- add `tailwindcss`, `@tailwindcss/vite` 4.3.5, `@fontsource/lora`, `@fontsource/raleway` 5.3.0.
- [x] `apps/web/src/index.css` -- Tailwind import, token variables light and dark, `@theme` mapping, font stacks, base body styles.
- [x] `apps/web/src/clips.ts` -- load and validate manifests, sorted by title.
- [x] `apps/web/src/route.ts` -- tiny hash route hook.
- [x] `apps/web/src/App.tsx`, `apps/web/src/ClipPicker.tsx` -- picker page and a stub clip page with Back to clips.
- [x] `apps/web/src/contrast.test.ts` -- reads token hex values from `index.css` and asserts 4.5:1 for every text pair in both modes.

**Acceptance Criteria:**
- Given `pnpm -r build`, when it runs, then the built CSS has the tokens and the `dist` holds the font files (no font CDN URL).
- Given the picker in a browser in light and dark mode, when viewed, then each clip shows title and "AI-generated" and selecting it opens `#/clip/<id>`.
- Given `pnpm typecheck && pnpm lint && pnpm test`, when run, then all pass.

## Implementation Notes

- Implemented and reviewed in the main session; the user asked to run Epic 1 through without check-ins, so checkpoints were self-approved and the three review layers ran inline instead of as subagents.
- `index.css` holds the tokens; `contrast.test.ts` parses its hex values, so a token edit that breaks 4.5:1 fails the tests.
- Checked in the browser pane: picker in light and dark, Lora and Raleway load from `dist/assets`, selecting the card opens `#/clip/000000000001`.
- `.claude/launch.json` starts the dev server for previews (not committed).

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | blind | Empty-list test mocks `console.warn` without restoring it | low | Spy leaks into later tests in the file; direct deletion | patch |
| 2 | edge | Raleway 600 is imported but unused | false | `@font-face` files load only when a rule uses the weight; Story 1.8 button uses it | reject |
| 3 | gap | Contrast checked from tokens, not rendered pages | low | Every text class maps to a tested pair; a browser check belongs to Story 5.5 | reject |

## Verification

**Commands:**
- `npx -y pnpm@12.23.0 typecheck && npx -y pnpm@12.23.0 lint && npx -y pnpm@12.23.0 test && npx -y pnpm@12.23.0 -r build` -- expected: exit 0

**Manual checks (if no CLI):**
- Preview the built site in the browser pane, light and dark; picker shows the fixture clip.
