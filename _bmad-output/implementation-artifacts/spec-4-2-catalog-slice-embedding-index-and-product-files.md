---
title: 'Story 4.2: Catalog slice, embedding index and product files'
type: 'feature'
created: '2026-11-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/planning-artifacts/epics.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The pipeline needs a local product catalog to retrieve from, and the web needs product files for referenced products only (AD-12, AD-19).

**Approach:** `pnpm abo build` reads the ABO listings, keeps English listings with a bullet point and a main image, dedupes by exact name, orders by item ID and keeps 20,000. It embeds each item with the pinned embedding model and writes the slice and index to the gitignored `data/catalog/`. `pnpm abo products` writes `data/products/<id>.json` and a small JPEG under `apps/web/public/products/` for every product the decide step will reference, and removes product files nothing references.

</frozen-after-approval>

## Implementation Notes

- Script name is `abo`, not `catalog`: pnpm 12 has a built-in `catalog` command that shadows a script of that name.
- Slice: 113,198 usable English listings, 20,000 kept. Index: `text-embedding-v4` at 512 dimensions, 2,000 requests of 10 inputs, 1.6 M tokens, $0.112 (price is an estimate, see config). Files: `data/catalog/slice.json`, `index.f32`, `index.json` (model name, dimensions, IDs).
- Embedded text is name, product type, key features and description. Key features are color, material, style and bullet points of at most 48 characters (at most 6), so reason lines stay short. Description is the first two bullet points, at most 300 characters.
- The product writer computes referenced IDs from `analysis` with `policy.rankFits` and `RANKED_MAX`, the same way `decide` builds `ranked`, because `decide` itself refuses to run while a product file is missing.
- Attribution on each product: "Amazon Berkeley Objects, Amazon.com, CC BY 4.0. Text shortened."
- `pnpm abo products` has not run yet: it needs real analysis (Story 4.9).

## Review Triage Log

Layers ran inline in this session (no subagents).

| Finding | Verdict | Evidence / route |
|---|---|---|
| Fixture products would be deleted as unreferenced | low | Rejected: the fixture analysis still references them, so they stay; Story 4.9 keeps the fixture as a test fixture. |
| An analysis product missing from the slice is silently skipped | medium | Patched: the writer fails and names the IDs. |
