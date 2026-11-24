# Epic 3 Context: Explore the ad and what it earned

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

After a pause shows an ad, the viewer can open the product on its own page (a simulated click), come back to the exact paused moment, see a demo QR code that leads nowhere, and read a session earnings tally that expands to a per-pause breakdown, including the zero earned by pauses that showed no ad. An attribution page credits the product catalog. Everything still runs on the hand-authored fixture clip; the real pipeline arrives in Epic 4.

## Stories

- Story 3.1: Product page, simulated click and demo QR
- Story 3.2: Session earnings tally and breakdown
- Story 3.3: Attribution page

## Requirements & Constraints

- The ad has a View product button that opens a simple product page (image, description, key features) and logs a simulated click.
- The ad also shows a QR code visibly marked as a non-functional demo; it encodes no real link.
- Each shown ad has a simulated price that rises with the campaign bid and relevance; platform and publisher split it 70/30. A no-ad pause earns 0 and is shown with its reason, so the cost of holding an ad back is visible.
- Every price, split, click, QR and zero earning is labeled "Simulated". No figure appears without the word.
- No network request after load; the web has no analytics. A simulated click lives only in the session.
- Product and model-derived text renders as text, never HTML.
- Catalog attribution is shown: Amazon.com credit for ABO, Collins et al. CVPR 2022 citation (arXiv:2110.06199), CC BY 4.0 link, statement of changes (slice, resized images, generated text), no-endorsement line. Sample clips are labeled AI-generated.
- Docs: no em dashes, no contractions.

## Technical Decisions

- Simulated values are typed: price, split, campaign, click, QR and the zero of a no-ad pause come from `policy` as values carrying `simulated: true` (`priceFor`, `splitPrice`, `ZERO_EARNING`). Components that render them take that type and always show the label. No simulated number is a bare `number` in web code.
- Money is integer cents; the split gives the publisher share rounded down and the remainder to the platform.
- `decisions` per scene already carries outcome, top product, price and split. The web reads only the manifest, `decisions` and product files and calls only `policy` resolve and format functions.
- Web state is only: paused flag, playback time, session pause log, and the display-only held top. The tally and breakdown derive from the pause log: one entry per pause event, a second pause in the same scene counts again. The log resets on reload.
- Product files: `data/products/<id>.json` (name, image path, description, key features, attribution), referenced by ID from `decisions`.
- Routing is hash based (`#/`, `#/clip/<id>`); the product page and attribution page are new routes.

## UX & Interaction Patterns

- Product page: own screen on the card surface with image, description, key features and "Simulated click recorded." (never purchase wording). The Back link and browser Back both return to the paused clip in the same paused state with the same overlay.
- Ad card, laptop: View product button, the QR at 35 percent opacity marked as demo, and the "Shown because" line. Phone hides tagline, QR and "Shown because".
- Session tally: one line below the player. "Simulated earnings: no pauses yet", then for example "Simulated earnings: 2 ads shown, 1 held back (0)". Tapping expands it in place to a per-pause list: reason or ad, simulated price, 70/30 split.
- Attribution page: reachable from the clip picker, with a Back link to the picker.
- Accessibility floor: WCAG 2.2 AA, 44 px touch targets, alt text, reduced motion, visible focus.

## Cross-Story Dependencies

- 3.1 adds the simulated click to the session pause log; 3.2 reads the same log for the tally. Both need the pause log to live above the watch screen route so it survives a visit to the product page.
- 3.1 needs the paused time and overlay to survive the product page round trip.
- 3.3 is independent of 3.1 and 3.2.
