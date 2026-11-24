---
name: Pausal
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Pausall-2026-11-22/addendum.md
  - docs/policy/ad-suppression-policy.md
  - docs/discovery/personas-jtbd.md
  - docs/discovery/product-brief.md
updated: 2026-11-23
---

# Pausal Experience Spine

## Foundation

Responsive web app, laptop and phone, dark mode by default with a light theme toggle that is remembered in the browser. No UI library is chosen yet; that is a Phase 4 decision. `DESIGN.md` is the visual identity reference. Hobby demo: sample clips only, uploads off (PRD F8). Every ad, campaign, click and number is simulated and labeled so.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Clip picker | Site link, header logo, Back to clips | Landing page that tells the idea before asking for anything: a hero with a looping sketch of a pause, why a pause is a fair moment, the four steps behind every pause, then the sample clips, each with a still frame, its duration and the "AI-generated" label (FR-17). Ends with "everything here is simulated". |
| Watch screen | Clip picker | Video, live scene panel, ranked list of up to 10 products, session earnings tally (F2, F3, F10). |
| Pause view | Pause on the watch screen | Overlay state of the watch screen: ad card, or frozen frame with one reason (F4). Not a separate page. |
| Product page | View product on the ad card | Image, description, key features, simulated click note (F5). Back returns to the paused clip. |
| Earnings breakdown | Tap the session tally | Per-pause list: reason, simulated price, 70/30 split (FR-23..25). Expands in place. |

No advertiser view. The advertiser question "why was my ad shown or not" is answered by the "Shown because" line on the ad and the reason on a no-ad pause.

→ Composition reference: [mockups/soft-calm.html](mockups/soft-calm.html). Spine wins on conflict.

## Voice and Tone

Calm, short, plain. The system explains itself in one line and never apologizes or sells.

| Do | Don't |
|---|---|
| "No ad here: sensitive scene." | "Oops! We could not find an ad for you." |
| "Shown because this scene is about making coffee." | "Recommended just for you!" |
| "Analyzing the first scenes…" | "Loading, please wait…" |
| "Simulated click recorded." | "Thanks for your purchase!" |
| "Simulated earnings: 2 ads shown, 1 held back (0)" | Any figure without the word "Simulated" |

No-ad reasons use the policy wording and order exactly: Analysis unavailable (checked first), Sensitive scene, Nothing fits well, No active campaign (`docs/policy/ad-suppression-policy.md`). A reason never names the sensitive details of a scene.

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md` Components.

| Component | Use | Behavioral rules |
|---|---|---|
| Video player | Watch screen | Native play and pause. Keeps 16:9 in every state. Playback never waits on analysis (FR-2). |
| Scene panel | Watch screen | Updates with the current scene: context, sentiment, brand-safe tag, "Based on this scene and the previous 3". |
| Product list | Watch screen | Up to 10 items, each a different product (sizes and colours of one product count once), each with a short name, relevance score and simulated bid or "no bid". The top one is larger with its reason. While playing, the top product changes at most once every 5 s unless the scene verdict changes (FR-8). While the pause card is open, the list leads with the product the card shows. Phone: items 2 to 10 scroll sideways. |
| Ad card | Pause view | Appears within 500 ms of pause (FR-12). Shows "Sponsored" and "Simulated ad", tagline (laptop only), View product, non-functional QR (laptop only, marked as demo), "Shown because" line (laptop only). Closes instantly on play. |
| Pause note | Pause view | "Paused" plus one reason line. Closes on play. |
| Session tally | Watch screen, below the player | One line counting ads shown and held back with simulated earnings. Tap to expand the breakdown. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| First chunk not analyzed (uploads only; sample clips are precomputed) | Watch screen | Scene panel shows "Analyzing the first scenes…"; product list is empty placeholders. Video plays. |
| Pause before analysis reaches the scene (uploads only) | Pause view | Pause note: "No ad here: analysis unavailable." |
| Ad allowed | Pause view | Ad card over the frozen frame. |
| Ad held back | Pause view | Frozen frame with pause note and the first failing reason in policy order. |
| Fewer than 10 products fit | Product list | Show only what ranks; no filler. |
| No ads yet this session | Session tally | "Simulated earnings: no pauses yet". |
| Analysis failed | Watch screen | Scene panel: "Analysis unavailable for this scene." Every pause shows no ad. |

## Interaction Primitives

- Pause and play by tap or click on the video, or Space on laptop.
- Play always closes the ad or pause note at once; no close button needed.
- No ad or overlay ever appears while the video plays.
- Product page opens as its own screen; browser Back and the Back link both return to the paused clip in the same paused state.
- No autoplay of a next clip.

## Accessibility Floor

- WCAG 2.2 AA. All text tokens meet 4.5:1 in both modes (see `DESIGN.md` Colors).
- Full keyboard use on laptop: Space toggles playback, Tab reaches the ad card's View product button, Escape or Space dismisses the pause view by resuming.
- When the ad card or pause note appears, its text is announced via a polite live region; focus does not jump.
- Scene panel updates are not announced continuously (too noisy); its current values are readable on demand.
- Touch targets at least 44 by 44 px on phone, including items in the sideways strip.
- prefers-reduced-motion: overlays appear without fade.
- Thumbnails have alt text with the product name.

## Responsive & Platform

| Width | Behavior |
|---|---|
| Laptop (1024 px and up) | Ad card centered at about 78 percent of frame width with tagline, QR and "Shown because" line. 9 small products in one row. |
| Phone (under 768 px) | Ad card covers most of the frame (8 px inset), playback bar visible; tagline, QR and "Shown because" hidden. Small products scroll sideways. |
| In between | [ASSUMPTION] Phone treatment until the laptop row fits. |

## Inspiration & Anti-patterns

- Rejected: Cinema Dark (red accent read as urgent) and Gallery Light. See [mockups/directions-1.html](mockups/directions-1.html).
- Rejected: resizing the player to fit the ad on phone (flagged by the user).
- Rejected: ads during playback, pop-ups, countdowns, or anything that blocks play.

## Key Flows

### Flow 1: Lunch-break pause (Lena, on her phone during a lunch break, opens a link a friend sent)

1. The link opens the clip picker. The headline and a short looping sketch show the idea in a few seconds; scrolling explains why the scene comes first and what happens after a pause. "Try a clip" takes her to the clips. On the watch screen a small "Pause anywhere" hint sits on the video until her first pause on that clip. Below are 4 sample clips, each with a still frame and labeled "AI-generated".
2. She taps "Morning kitchen". The clip plays; the scene panel shows: Kitchen, morning, making coffee · Relaxed · Brand safe.
3. The product list settles: the espresso pot on top, the rest in the sideways strip.
4. **Climax:** she pauses as coffee is poured. Within half a second the ad card covers most of the frozen frame: the pot, "Sponsored", "Simulated ad", View product.
5. She taps View product. The product page opens with image, description, features and "Simulated click recorded." She goes back to the paused clip.
6. She presses play; the ad closes at once.
7. Later the clip cuts to a tense phone call. She pauses: the frame stays frozen with "No ad here: sensitive scene."
8. Below the player the tally reads "Simulated earnings: 2 ads shown, 1 held back (0)". She taps it and sees each pause with its reason, price and 70/30 split.
9. Back to clips returns her to the picker.

Failure (uploads only): she pauses before the first scenes are analyzed → "No ad here: analysis unavailable." Play resumes normally.

## Open Items

- [ASSUMPTION] Typography sizes and the in-between breakpoint are taken from the mock and need confirming in build.
- Which 4 sample clips, and their titles, depend on the Phase 1 data sources and catalog fit (FR-17).
- UI library choice moves to Phase 4.
