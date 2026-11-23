# ADR 0007: Describe, then judge

Status: accepted. Date: 2026-11-22. Spine: AD-5, AD-7, AD-12.

## Context
Dialogue and on-screen text are untrusted, and the Jev docs state that adversarial text can move its answers. The PRD requires brand safety to be classified from the scene description, not raw dialogue.

## Decision
The Qwen VLM writes one description per scene, and any speech-to-text output is turned into a neutral dialogue summary inside that step. Judges receive the description only. Taglines and reason lines are generated only for scenes where the policy package reports the safety rules as passed, and are checked against product data with a product-name fallback.

## Consequences
- Prompt injection has to pass through the describing model before it reaches a judge, and a second judge must still agree.
- Intense dialogue is judged from the summary, which may lose nuance. The evaluation should include dialogue-heavy scenes.
- Description quality caps every downstream result.
