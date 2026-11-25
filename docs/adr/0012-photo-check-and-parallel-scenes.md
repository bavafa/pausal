# ADR 0012: Check the shown product's photo against the scene; analyze scenes in parallel; no placeholder products

Status: accepted. Date: 2026-11-25. Amends ADR 0010 and AD-12.

## Context
On an uploaded office video, the ad was a rustic wooden desk. The Jev fit question sees only the product name and the scene description, so "Office Computer Desk" scored high for any office, whatever the desk looks like. The product list also showed products whose catalog image is an "Image Coming Soon" placeholder, with names such as "N/A" or a product code. And a 3 minute upload took 3 to 4 minutes, because every scene ran its model calls one after another.

An experiment on the Tears of Steel scenes (cost under 1 cent) compared three fixes. Asking Jev to also judge style cut scenes with a fit of 0.6 or more from 11 to 4, dropping good matches. A vision check on the photo of the product about to be shown kept 8 of 11 and rejected the rustic desk for a modern office.

## Decision
- Photo check: for each scene that can show an ad, the vision model (`qwen3.7-flash`) gets the photo of the top product, its name and the scene description, and answers whether the product's purpose and look suit the scene. A rejected product gets `photoCheck: "fail"` on its fit and drops out of `rankFits`, so it is neither the ad nor in the product list, and the next product is checked (at most 3 per scene). The check fails open: an error leaves the product unchecked and shown, since this is about fit, not safety.
- Parallel scenes: `analyzeClip` runs describe, judge, retrieve and fit for up to 6 scenes at once, then blends relevance in scene order, then writes taglines. The browser sends up to 5 chunks at once (was 3).
- Placeholder images: listings whose main image is the ABO placeholder `61kVdTXTJ4L` are left out of the catalog; the relay and the analyze CLI drop them from the existing index at load, so the index needs no rebuild.
- Uploads show a progress view over the player until every chunk is analyzed.

## Consequences
- Tears of Steel, re-analyzed: 9 photo checks, 2 rejected, cost under $0.0001. Ads at 6.4 percent of pause times (6 of 69 scenes), down from 9.7 percent; part of the change comes from the re-analysis itself, since model answers vary between runs. (A first run, before the analyze CLI dropped placeholder products, gave 5.6 percent with 3 of 11 rejected.)
- The landing page shows this trade-off, computed from the shipped decisions: a generic pause ad on every pause against Pausal's share, with the held-back reasons.
- The full 3 minute clip analyzes in about 80 s in one process (was about 7 minutes sequentially by the same per-scene time). Upload time on Vercel is not yet measured after this change.
- Up to 30 model calls run at once per upload (5 chunks of 6 scenes); provider rate limits are untested at that level.
- The tagline check still does not catch an invented feature ("Stand to work with this desk" for a desk that is not a standing desk).
