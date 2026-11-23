# ADR 0002: TypeScript workspace, Vite single-page app, no UI library

Status: accepted. Date: 2026-11-22. Spine: Design Paradigm, Stack.

## Context
The UX has five surfaces with custom pieces (a video overlay card, a product strip, an expanding tally). The pipeline and the web app must share one artifact schema. The UI library choice was deferred from Phase 3.

## Decision
A pnpm workspace in TypeScript with `packages/bundle-schema`, `packages/policy`, `packages/pipeline` and `apps/web`. The web app is a Vite and React single-page app styled with Tailwind v4 and the Soft Calm tokens as CSS variables. No component library is added.

## Consequences
- One language and one schema, so no drift between pipeline and web.
- No copied component code to maintain. A single primitive library such as Radix may be added later for one component if needed.
- Versions were confirmed on 2026-11-22 and are listed in the spine Stack table (Vite 8, React 19, Tailwind 4, TypeScript 7, Node 24 LTS); re-check at scaffold.
- Rejected: Astro with islands and Next.js static export (more framework than one interactive screen needs), and a Python pipeline (splits the schema across two languages).
