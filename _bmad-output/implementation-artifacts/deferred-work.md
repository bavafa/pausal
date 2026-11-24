# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-artifact-and-config-schemas-that-fail-closed.md`
  summary: bundle-schema (and likely policy) source files can import a sibling package by a relative path such as `../../pipeline/src/index.ts` without a lint error.
  evidence: Implementation agent probe in Story 1.2 review, lint exit 0; the `**/packages/**` pattern does not match `../../pipeline/...`. Pre-existing since Story 1.1, which recorded the policy case as a shortcut.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-scene-lookup-and-pause-resolution.md`
  summary: Pausing when the clip has ended (time equal to `durationMs`) resolves to "Analysis unavailable"; the watch screen should not open a pause view on `ended`.
  evidence: Edge-case review of Story 1.4; `sceneAt` uses half-open intervals so the end time is outside every scene, as the frozen matrix requires. Belongs to Story 1.7.
