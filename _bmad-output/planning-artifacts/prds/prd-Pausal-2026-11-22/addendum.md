# Addendum

## Model plan (technical, not PRD content)
Single provider: Qwen (Alibaba Model Studio or OpenRouter). Names and prices unverified.
- Frames to scene description: Qwen VLM. Speech to text: Qwen speech model (skip for clips without dialogue). Retrieval: Alibaba text embeddings. Taglines, reason lines, fallback judge: Qwen text model. Scene type, sentiment, safety and product judging: Jev, compared with the Qwen judge.
- Taglines are generated at analysis time, only for scenes that pass the policy safety rules, and cached per scene and product.
- Uploads send frames to a China-hosted API: the upload notice must name the provider; terms still to check.
- Campaigns are synthetic; the relevance-versus-revenue slider is cut from scope.

## Frame sampling (from the author's original spec)
- Uploads: the browser samples about 1 frame per second at about 512 px wide and extracts the audio, then sends only those to the server. The server analyzes, returns results and deletes the inputs. Nothing from uploads is stored or logged; only numeric results are cached by content hash with a short expiry. Upload is behind a feature flag.
- Sample clips are analyzed in chunks, first 20 seconds first.
- Scene judge (Jev): scene type as a Choice, sentiment as a 5-level Score mapped to -1..+1, brand safety as one Noul per category, product relevance as one Noul per scene and product pair. Jev cannot write text, so a language model or a template writes the "why" line.
- Open, test in the evaluation: whether 1 fps is enough for fast scene changes (fights, action), and whether to sample adaptively.
- Optional refinement to test: the server groups sampled frames into scenes by frame change and sends 3-4 evenly spaced frames per scene to the VLM, to limit model calls.
