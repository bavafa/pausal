# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-artifact-and-config-schemas-that-fail-closed.md`
  summary: bundle-schema (and likely policy) source files can import a sibling package by a relative path such as `../../pipeline/src/index.ts` without a lint error.
  evidence: Implementation agent probe in Story 1.2 review, lint exit 0; the `**/packages/**` pattern does not match `../../pipeline/...`. Pre-existing since Story 1.1, which recorded the policy case as a shortcut.
