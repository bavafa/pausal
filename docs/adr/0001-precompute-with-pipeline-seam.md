# ADR 0001: Precompute with a pipeline seam

Status: accepted. Date: 2026-11-22. Spine: AD-1, AD-13.

## Context
The first release has four fixed sample clips, no uploads and a hosting and model budget under 10 USD per month. The pause view must appear in under 500 ms, and Jev is early access with no latency guarantee.

## Decision
Scene analysis runs offline on the author's machine and writes committed artifacts. The web app is static and makes no model call. The pipeline is one library with no file system assumptions, so a server can host it later behind the upload flag.

## Consequences
- Pause is an in-memory lookup and cost at runtime is zero.
- FR-22 chunking becomes an ordering rule on the artifacts, and the "analyzing" UX states apply to uploads only.
- Uploads later mean adding a host for the same pipeline, not rewriting it.
- Rejected: a live analysis service (puts vendor risk and per-visit cost on the demo path).
