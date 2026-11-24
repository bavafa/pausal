---
title: 'Workspace scaffold deployed to GitHub Pages'
type: 'chore'
created: '2026-11-23'
status: 'done'
baseline_commit: '685d2dbf4cbe49862985363d482c69204426d730'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo has no code, a placeholder CI job and no deploy, so no later story has a checked, deployed project to land in.

**Approach:** A pnpm TypeScript workspace with the four packages, an import-boundary lint, a secret scan (pre-commit and CI) and a GitHub Actions pipeline that checks every push and deploys a placeholder `apps/web` page to GitHub Pages from `main`.

## Boundaries & Constraints

**Always:** Versions pinned exactly as confirmed by `npm view` on 2026-11-23 and written back to the spine Stack table. Import rules: `apps/web` and `packages/pipeline` import only `@pausal/policy` and `@pausal/bundle-schema`; `packages/policy` imports only `@pausal/bundle-schema` and no `node:*`/`fs`/`http`/`net` module nor `fetch`, `window`, `document`, `XMLHttpRequest`, `localStorage`, `navigator`. `.env` stays gitignored. CI holds no secrets and calls no model. Docs: no em dashes, no contractions.

**Decisions:** Node 26 LTS (26.13.1 confirmed 2026-11-23) in `engines`, `.nvmrc` and CI; the spine Node row is updated to 26. Before the first push the agent sets the Pages source with `gh api -X POST repos/bavafa/pausal/pages -f build_type=workflow`. The full spec is kept at about 1,700 tokens.

**Never:** No schema, policy or pipeline logic (Stories 1.2 to 1.5). No Tailwind, fonts or design tokens (Story 1.6). No UI library. No `decisions` regeneration or eval step in CI yet (no artifacts exist). Do not touch `services/`, `scripts/`, `data/samples/`, the UX `.working/` folder or locked Phase 1 docs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Clean build | fresh clone, `pnpm install && pnpm -r build` | all four packages build, exit 0 | N/A |
| Web imports pipeline | `import "@pausal/pipeline"` in `apps/web/src` | `pnpm lint` fails, names `@pausal/pipeline` | non-zero exit |
| Policy uses I/O | `import "node:fs"` or `fetch(...)` in `packages/policy/src` | `pnpm lint` fails naming the import or global | non-zero exit |
| Policy imports schema | `import "@pausal/bundle-schema"` in policy | lint passes | N/A |
| Secret staged | a file with an AWS-style key is staged | pre-commit hook blocks the commit; CI scan fails | non-zero exit |

</frozen-after-approval>

## Code Map

- `.github/workflows/ci.yml` -- placeholder job; replace entirely.
- `.gitignore` -- already ignores `node_modules/`, `.env`, `.env.*`; add `dist/`.
- `apps/web/.gitkeep` -- delete once `apps/web` has files.
- `_bmad-output/planning-artifacts/architecture/architecture-Pausal-2026-11-22/ARCHITECTURE-SPINE.md` -- Stack table (around line 204): record confirmed versions and date.
- `docs/eval/` -- exists, empty; add `.gitkeep`.
- Confirmed versions (2026-11-23): pnpm 12.23.0, typescript 7.0.2, vite 8.3.8, @vitejs/plugin-react 6.3.0, react and react-dom 19.3.1, @types/react and @types/react-dom 19.3.0, tailwindcss and @tailwindcss/vite 4.3.5 (recorded, installed in 1.6), vitest 5.1.1, oxlint 1.95.0, secretlint 14.1.0 with @secretlint/secretlint-rule-preset-recommend 13.1.0, @types/node 26.6.6.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `.npmrc` -- root workspace with `packageManager: pnpm@12.23.0`, `engines.node`, scripts `build`, `typecheck`, `lint`, `test`, `secrets`, `prepare` -- one entry point for CI and local use.
- [x] `packages/bundle-schema`, `packages/policy`, `packages/pipeline` -- `package.json` (name `@pausal/<dir>`, `exports` to `./src/index.ts`, `build: tsc --noEmit`), `tsconfig.json`, `src/index.ts` with one exported placeholder; pipeline and policy depend on schema via `workspace:*` -- packages ship source, no dist.
- [x] `apps/web` -- Vite React app: `index.html`, `src/main.tsx` rendering a one-line placeholder ("Pausal. Experiment in progress. All ads are simulated."), `vite.config.ts` with `base: '/pausal/'`, `build: tsc --noEmit && vite build` -- deployable page.
- [x] `.oxlintrc.json` -- `no-restricted-imports` and `no-restricted-globals` overrides per path as in Always -- the AD-23 import lint.
- [x] `tests/import-rules.test.ts` -- vitest: writes a temp forbidden-import file into each guarded package, runs oxlint, asserts non-zero exit and the import name in output; plus the allowed policy-to-schema case -- proves the lint actually fails.
- [x] `.secretlintrc.json`, `.githooks/pre-commit` -- recommended preset; hook runs secretlint on staged files; `prepare` sets `core.hooksPath .githooks`.
- [x] `.github/workflows/ci.yml` -- on push and PR: install with frozen lockfile, typecheck, lint, test, secret scan, build; on push to `main` only, upload `apps/web/dist` and deploy with `actions/deploy-pages` -- CI and deploy.
- [x] `config/`, `data/{manifest,analysis,decisions,products,labels}/`, `docs/eval/` -- `.gitkeep` in each.
- [x] Spine Stack table -- update versions and the confirmation date.

**Acceptance Criteria:**
- Given a clean clone, when `pnpm install --frozen-lockfile && pnpm -r build` runs, then it exits 0 and every required directory exists.
- Given a push to `main`, when Actions runs, then typecheck, lint, test, secret scan and build pass and the placeholder page is live at `https://bavafa.github.io/pausal/`.
- Given the CI workflow file, when inspected, then it references no secret and no model endpoint.

## Design Notes

typescript-eslint does not support TypeScript 7 (peer range below 6.1), so the import lint uses oxlint, which parses TS without the compiler. Packages export `.ts` source (`erasableSyntaxOnly`, `allowImportingTsExtensions`, `noEmit`): Vite bundles it for the web and Node runs pipeline TS natively later, so there is no library build step. secretlint is pure npm, so the same command runs in the hook and in CI with no binary install.

## Verification

**Commands:**
- `pnpm install --frozen-lockfile && pnpm -r build` -- exit 0
- `pnpm typecheck && pnpm lint && pnpm test && pnpm secrets` -- exit 0
- `ls config data/manifest data/analysis data/decisions data/products data/labels docs/eval` -- all exist

**Manual checks:**
- After the first push to `main`, the Actions run is green and the Pages URL shows the placeholder line.

## Implementation Notes

- `engines.node` is `>=26 <27`; `.nvmrc` pins 26.13.1 for CI. The local machine runs 26.9.0, which a strict 26.13.1 floor would reject.
- The pre-commit hook calls `./node_modules/.bin/secretlint` directly, so it works without a global pnpm.
- CI actions pinned to current majors: checkout v7, setup-node v7, pnpm/action-setup v6, upload-pages-artifact v5, deploy-pages v5. Deploys on `main` are never cancelled by concurrency.
- npm marks `@secretlint/secretlint-rule-preset-recommend` 13.1.0 as deprecated; it still runs and blocks an AWS key.
- The Pages source call and the first push to `main` are not done yet.
- Verification pass: policy's import rule widened to reject every bare import except `@pausal/bundle-schema` (relative imports allowed), so `child_process`, `https` and model clients such as `openai` also fail; two test cases added. Action majors confirmed against each project's latest release.
- Added `tests/secret-scan.test.ts` to cover the secret matrix row; the AWS rule allowlists the published EXAMPLE key, so the probe uses a made-up value built at runtime.
- shortcut: `globalThis.fetch` and `require()` are not caught by the policy lint; upgrade if policy ever gains a reason to touch globals.
- Review patch pass: lint covers subpaths, relative cross-package paths, a bundle-schema override and `globalThis`/`self`/`process`; hook scans staged blobs via `git checkout-index`; root `tsconfig.json` type-checks `tests/`; CI push limited to `main`, deploy serialized. 23 tests pass from a clean install.
- shortcut: a policy file can still reach a sibling package with `../../pipeline/src/...` (no `packages/` segment in the path); blocking `../../**` would also reject legitimate nested imports. Upgrade if policy ever grows that deep.

## Spec Change Log

## Review Triage Log

| # | Source | Finding | Verdict | Evidence | Route |
|---|---|---|---|---|---|
| 1 | edge | Policy rejects nested relative imports (`./sub/a.ts`) | high | Reviewer probe exit 1; blocks every multi-file policy module from Story 1.3 | patch |
| 2 | edge | Policy rejects `@pausal/bundle-schema/x` subpaths | low | Same pattern list, no subpath negation; direct one-line correction | patch |
| 3 | edge | Web/pipeline can import `@pausal/pipeline/x` subpath | medium | Group `@pausal/*` does not match two-segment subpaths; probe exit 0 | patch |
| 4 | edge | Web/pipeline can reach another package by relative path | medium | Probe of `../../../packages/pipeline/src/index.ts` exit 0; AD-23 bypass | patch |
| 5 | edge | bundle-schema has no override | medium | Spine graph gives schema no outgoing arrows; nothing enforces it | patch |
| 6 | blind, edge, gap | Policy globals bypass via `globalThis`, `self`, `process` | low | Probe exit 0; fix is three list entries | patch |
| 7 | edge | `import('node:fs')` type expressions pass in policy | low | Rare, type-only, fix needs a new rule | reject |
| 8 | edge, gap, blind | Hook scans working tree, not staged blobs | medium | `git diff --cached --name-only` passes paths, secretlint reads disk copy | patch |
| 9 | edge, blind | Hook fails opaquely without node_modules | low | Direct guard line | patch |
| 10 | edge | Hook skips force-added gitignored files | maybe-false | Would need to check secretlint gitignore handling; only low if true | reject |
| 11 | blind | `prepare` uses `\|\| true`, silent hook failure | low | Intended for non-git installs; fix adds branching | reject |
| 12 | edge | Secret positive test passes on missing binary | low | `status` null is `not.toBe(0)`; one assertion fixes it | patch |
| 13 | blind, edge | `tests/` never type-checked | medium | No tsconfig includes `tests`; `pnpm -r` skips root | patch |
| 14 | blind, edge | Probe files left behind if test is killed | low | Needs SIGKILL mid-test; fix adds machinery | reject |
| 15 | gap, edge | `secret-scan.test.ts` untracked | false | Nothing is committed yet; the story commit adds all new files | reject |
| 16 | gap, blind | Pages base path unchecked / casing | false | Remote is `bavafa/pausal` (lowercase), matches `/pausal/`; live check is the manual AC | reject |
| 17 | gap | Pre-commit hook never exercised by a test | low | CI `pnpm secrets` is the enforced backstop; hook test needs a temp repo | reject |
| 18 | blind | Tailwind in Stack but not installed | false | Spec Never section moves Tailwind to Story 1.6 | reject |
| 19 | blind | CI runs twice on PR branches | low | No branch filter on push; one-line correction | patch |
| 20 | blind | Deploy has no Pages concurrency group | low | Two quick pushes can deploy out of order; one-line correction | patch |
| 21 | blind | Library `build` equals `typecheck` | low | Spec-chosen design (no dist); duplicate run is harmless | reject |
| 22 | blind | `minimumReleaseAgeExclude` unexplained | low | Twenty pinned entries with no reason; comment line | patch |
| 23 | blind | Diff omits lockfile and spec | false | Excluded on purpose from review scope; lockfile generated | reject |
| 24 | blind | Web may import `node:fs` | false | AD-23 restricts package arrows only; Vite build fails on Node modules anyway | reject |
| 25 | blind | `Date.now`, `Math.random` allowed in policy | false | Intent restricts I/O, not determinism | reject |
| 26 | blind | Most policy globals untested | low | Gap reviewer probed all and they fail correctly; adding table rows is trivial | patch |
