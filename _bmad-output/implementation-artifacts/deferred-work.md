# Deferred Work

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-artifact-and-config-schemas-that-fail-closed.md`
  summary: bundle-schema (and likely policy) source files can import a sibling package by a relative path such as `../../pipeline/src/index.ts` without a lint error.
  evidence: Implementation agent probe in Story 1.2 review, lint exit 0; the `**/packages/**` pattern does not match `../../pipeline/...`. Pre-existing since Story 1.1, which recorded the policy case as a shortcut.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-scene-lookup-and-pause-resolution.md`
  summary: Pausing when the clip has ended (time equal to `durationMs`) resolves to "Analysis unavailable"; the watch screen should not open a pause view on `ended`.
  evidence: Edge-case review of Story 1.4; `sceneAt` uses half-open intervals so the end time is outside every scene, as the frozen matrix requires. Belongs to Story 1.7.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-decide-command-on-a-hand-authored-fixture.md`
  summary: Fixture product `imagePath` values (`products/fixture-*.png`) and the manifest video URL point at files that do not exist yet.
  evidence: Story 1.5 review; Stories 1.7 and 1.8 must supply the real clip and images or replace the placeholders.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-7-watch-screen-with-the-player.md`
  summary: In Firefox a click on the video may toggle playback twice (native click-to-play plus the page handler).
  evidence: Unverified; only Chrome was checked. Settle with a Firefox click test, for example in the Story 5.5 browser check.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-8-pause-view-ad-card-or-pause-note.md`
  summary: The phone ad card leaves 72 px for the native playback bar, measured in Chrome only; Safari on iPhone may need a different gap.
  evidence: Unverified; Safari draws its own control bar. Settle with an iPhone Safari pause on the fixture clip.
