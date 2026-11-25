---
name: Pausal
description: Calm, minimal web demo that shows a sponsored product on pause only when the scene fits. Soft Calm direction, dark by default with a light theme toggle, laptop and phone.
status: final
sources:
  - _bmad-output/planning-artifacts/prds/prd-Pausal-2026-11-22/prd.md
  - _bmad-output/planning-artifacts/prds/prd-Pausal-2026-11-22/addendum.md
  - docs/policy/ad-suppression-policy.md
  - docs/discovery/personas-jtbd.md
  - docs/discovery/product-brief.md
updated: 2026-11-24
colors:
  background: '#F4F7F7'
  foreground: '#164E63'
  card: '#FFFFFF'
  muted: '#E6EFF1'
  muted-foreground: '#475569'
  border: '#D3E3E6'
  accent: '#0E7490'
  accent-foreground: '#FFFFFF'
  background-dark: '#0F1C1F'
  foreground-dark: '#E3EEF0'
  card-dark: '#16272B'
  muted-dark: '#1D3237'
  muted-foreground-dark: '#9FB4B9'
  border-dark: '#2A4247'
  accent-dark: '#5FB8C8'
  accent-foreground-dark: '#0F1C1F'
  frozen-scrim: 'rgba(0,0,0,0.30)'
typography:
  # Sizes taken from the approved mock (directions-2.html). [ASSUMPTION] exact ramp to confirm in build.
  title:
    fontFamily: 'Lora'
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
  title-sm:
    fontFamily: 'Lora'
    fontSize: 15px
    fontWeight: '500'
    lineHeight: '1.3'
  body:
    fontFamily: 'Raleway'
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Raleway'
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  eyebrow:
    fontFamily: 'Raleway'
    fontSize: 11px
    fontWeight: '500'
    letterSpacing: 0.08em
rounded:
  sm: 8px
  md: 14px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 24px
  gutter-phone: 12px
  gutter-laptop: 18px
components:
  ad-card:
    background: '{colors.card}'
    foreground: '{colors.foreground}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  button-primary:
    background: '{colors.accent}'
    foreground: '{colors.accent-foreground}'
    radius: '{rounded.md}'
  brand-safe-tag:
    border: '{colors.accent}'
    foreground: '{colors.accent}'
    radius: '{rounded.full}'
  product-thumb:
    background: '{colors.muted}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  pause-note:
    background: '{colors.card}'
    foreground: '{colors.foreground}'
    radius: '{rounded.md}'
---

## Brand & Style

Pausal is an experiment about a single moment: the viewer presses pause. The design posture is calm and assuring, minimal and elegant. A pause should feel like an exhale, not a sales pitch. The video is always the brightest, most saturated thing on screen; everything around it is soft, tinted and quiet. The serif headings give the ad an editorial, considered voice; the sans body keeps the rest plain.

Direction chosen from three rendered options (Cinema Dark, Gallery Light, Soft Calm). Palette and pairing originate from ui-ux-pro-max matches (Wellness Calm pairing, healthcare palette teal), adjusted for contrast.

→ Visual reference: [mockups/soft-calm.html](mockups/soft-calm.html). Rejected directions: [mockups/directions-1.html](mockups/directions-1.html). This spine wins on conflict with any mock.

## Logo

The logo is the wordmark "PA||SAL": Pausal in uppercase Raleway semibold with wide tracking, where the U is a pause sign made of two accent bars as tall as the capitals. There is no separate symbol beside the word. Screen readers hear "Pausal". The favicon is the two accent bars on a dark rounded tile. A sticky header carries the logo (a link home) and an icon-only theme toggle on every page. The two bars are the one place the accent is used decoratively.

## Theme

Dark is the default. A "Light theme" / "Dark theme" button sits fixed in the top right of every screen and remembers the choice in the browser (`localStorage`, nothing sent). The choice is applied before the page draws, so it never flashes light.

## Colors

- **Background (`#F4F7F7` light / `#0F1C1F` dark)**: a tinted neutral, never pure white or pure black. Dark mode is a deep teal-black so the video stays the brightest element.
- **Foreground (`#164E63` / `#E3EEF0`)**: deep teal text, 8.5:1 on light background, 14.7:1 on dark.
- **Card (`#FFFFFF` / `#16272B`)**: the ad card, the pause note and the product page surface.
- **Muted and muted foreground**: thumbnail wells and secondary text (reasons, labels, "Based on this scene and the previous 3"). Muted foreground is 7.0:1 light, 8.0:1 dark.
- **Accent (`#0E7490` / `#5FB8C8`)**: the one action color. Used for the View product button, the brand-safe tag outline and the playback progress. Not used decoratively. 5.0:1 on light background; 7.6:1 on dark.
- **Border**: decorative only (1.2:1). Nothing important may depend on a border alone being seen.

Avoid: red or alarm colors on the pause view (a held-back ad is not an error), gradients on UI surfaces, a second accent.

## Typography

- **Lora** for product names and the ad title (`title`, `title-sm` on phone). The serif is used only where a product is being presented.
- **Raleway** for everything else: body, scene panel, reasons, labels.
- `eyebrow` (uppercase, tracked) only for "Sponsored", "Simulated ad" and scene panel keys (Scene, Sentiment).
- Fonts are self-hosted through `@fontsource` (no request to Google Fonts) with system fallbacks (Georgia for Lora, system-ui for Raleway).

## Layout & Spacing

4-based spacing scale. Two layouts:

- **Laptop:** video full width of the content column at 16:9; below it the scene panel as a slim strip, then the top product (150 px thumb plus text) and a row of 9 small products.
- **Phone (375 px reference):** same order. Top product thumb 96 px. The 9 small products become a sideways scroll strip (84 px items).

The video keeps its aspect ratio in every state; nothing resizes the player.

## Elevation & Depth

One elevation level: the ad card and pause note float over the frozen frame with a soft shadow. The frozen frame itself is desaturated and dimmed (`saturate(.35) brightness(.7)`) so the card reads as foreground. No other shadows.

## Shapes

Soft corners throughout: `{rounded.md}` (14 px) for the video, cards, thumbnails and buttons; `{rounded.full}` for the brand-safe tag only.

## Components

- **Ad card (laptop):** centered on the frozen frame, about 78 percent of its width. Image left (38 percent), then eyebrow "Sponsored", title, tagline, View product button, the non-functional QR (shown at 35 percent opacity) and the "Shown because" line in `label` muted.
- **Ad card (phone):** covers most of the frozen frame with an 8 px inset, leaving the playback bar visible. Image takes the left 40 percent. Tagline, QR and "Shown because" line are hidden.
- **Pause note:** small centered card: "Paused" plus one reason line in muted foreground.
- **Scene panel:** inline strip, eyebrow keys, brand-safe tag as an accent outline pill.
- **Top product:** larger thumb, eyebrow "Sponsored · simulated bids", the short name as a Lora title, the full listing name on one truncated muted line, a one-line reason, then two chips: "Relevance: N" and either "Bid: $x" or a dashed "Bid: none". Smaller tiles show the same two values on two lines.
- **Other products:** thumb, short name, then "N · $x bid" or "N · no bid". Short names are two to four words from the text model; the full name stays on the product page.
- **Product images:** always shown whole (`object-contain`) on a white well with a small inset, because catalog photos have white backgrounds; never cropped. Images are shown no larger than 256 px, the size of the catalog files, so they are not blown up and blurred.
- **Clip picker:** a story in four parts. Hero: eyebrow, the headline "Ads that wait until you pause.", two sentences, a "Try a clip" button that scrolls to the clips, and a drawn, looping sketch of a kitchen scene that pauses and shows one product card (static in reduced motion). "The idea": why a pause is a fair moment and why the scene comes first, with two example pauses (an ad, and a sensitive-scene note). "Under the hood": four numbered steps of what happens when you pause, and a note that each video is analyzed once when it is added. Copy is short and plain (rewritten 2026-11-24). "Try it": the clip cards (still frame, a play badge on hover, title, "AI-generated" and duration). A footer line that everything is simulated, with the Attribution link.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Keep the video the brightest thing on screen | Use pure black or pure white surfaces |
| Use the accent only for the one action, the safe tag and the two bars of the logo | Color a held-back ad in red or warning tones |
| Keep the player 16:9 in every state | Resize or reflow the player on pause |
| Label every ad, number and campaign as simulated | Show a price or earnings figure without "Simulated" |
| Let the ad cover most of the frame on phone | Let the ad cover the playback bar |
