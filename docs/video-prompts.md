# Video generation prompts for the 4 sample clips

Prompts for a text-to-video tool (Veo 3, Sora 2, Kling, Runway or similar) to make the 4 AI-generated sample clips. Each clip is a short story built from 8 to 10 shots of about 8 seconds, joined into one file. The set mixes looks on purpose: one 3D animated clip, one live-action drama, one sci-fi film and one 2D animated clip, so the pipeline is tested on more than daily home scenes.

Together the 4 clips cover all six safety categories:

| Clip | Look | Safe scenes for ads | Sensitive scenes |
|---|---|---|---|
| 1 Breakfast Rush | 3D animation | Kitchen goods | Child focused, medical trauma (mild) |
| 2 The New Sofa | Live action, dialogue | Living room furniture | Intense dialogue |
| 3 Night Shift, Neo Lagos | Sci-fi, live action | First half: office, headphones, jacket, bag, bar | Second half: violence, death or grief |
| 4 Paper Moon | 2D hand-drawn animation | Dinner, decor, tableware | Sexual (implied, fully clothed) |

Clip 3 is the split clip: the first half is brand safe, so ads show on a pause there; the second half is a gunfight and a death, so every pause there must show no ad.

## Rules for every shot

- Paste the clip's **style line** and **cast** at the start of every shot prompt, unchanged, so faces, rooms and light stay the same across shots. If the tool supports a reference image or "character" feature, generate the cast once and reuse it.
- Each shot holds one setting and one action. A cut between shots is a new scene for the pipeline, so do not ask for two places in one shot.
- Show ordinary, unbranded goods clearly in the safe shots: pans, kettles, mugs, lamps, sofas, rugs, headphones, jackets, sneakers, bags, glasses, desk chairs. These are what the catalog sells, even in a sci-fi or animated world.
- Always add: "No logos, no readable brand names, no on-screen text, no subtitles, no watermark."
- Sensitive shots stay within what the tools allow: no gore, no visible wounds beyond a small cut or a dark stain on clothing, no nudity. They only need to be clear enough for a judge to flag them.
- Audio: ambient sound and music fitting the look on every shot. Spoken lines only where a shot lists them.
- Target per clip: 60 to 120 seconds, 16:9, 1080p or 720p, under 25 MB after export.

## Clip 1: Breakfast Rush (3D animation)

**Style line:** Stylized 3D animated short film, 16:9, soft rounded characters with big expressive eyes, warm saturated colors, gentle morning light, smooth camera moves, a cozy kitchen with wooden counters, pastel tiles and plants on the window sill. Original characters.

**Cast:** MAYA, a cheerful mother with dark curly hair in a bun, wearing a mustard sweater. LEO, her 7-year-old son with messy brown hair and a striped t-shirt. PICKLE, their small round orange cat.

1. Wide shot. Maya fills a white electric kettle at the sink and sets it on its base; Pickle watches from the counter. Safe.
2. Close-up. Maya pours steaming water from the kettle into a glass pour-over coffee maker; steam curls into little swirls. Safe.
3. Medium shot. Maya flips pancakes in a black non-stick frying pan; one pancake lands perfectly, she grins. Safe.
4. Medium shot. Maya sets ceramic plates, colorful mugs and cloth napkins on a round wooden table. Safe.
5. Medium shot. Leo sits at the table alone, drawing with crayons, swinging his legs and humming; the camera stays on him. Child focused.
6. Close-up. Leo holds up a drawing of Pickle and laughs; Pickle jumps onto the table and knocks the crayons over. Child focused.
7. Close-up. At the counter Maya's knife slips while slicing an apple; she yelps and pulls back her hand, a small cut on her fingertip with a drop of red. Medical trauma (mild).
8. Medium shot. Maya wraps a bandage around her finger from a first-aid box, wincing, while Leo watches with worry. Medical trauma (mild).
9. Wide shot. Maya, finger bandaged, sits with Leo at the table eating pancakes; Pickle curls up on a knitted blanket on a chair. Safe.

## Clip 2: The New Sofa (live action, dialogue)

**Style line:** Naturalistic indoor drama, 16:9, warm evening lamp light, static and slow-push camera, realistic people, a cozy living room with a large window, wooden floor and a few cardboard boxes.

**Cast:** SAM, a man in his early 40s with a short beard, wearing a navy flannel shirt. NINA, a woman in her late 30s with a straight black bob, wearing a mustard cardigan.

1. Wide shot. Sam and Nina stand in the half-furnished living room holding mugs. Nina: "I think the sofa goes under the window." Sam: "Then the lamp has nowhere to go." Safe.
2. Medium shot. Nina unrolls a large woven wool rug across the floor. Nina: "See? It already feels warmer in here." Sam: "It does. I take it back." Safe.
3. Medium shot. Sam assembles a tall brass floor lamp and switches it on; warm light fills the corner. Sam: "Better?" Nina, smiling: "Much better." Safe.
4. Two shot. They sit on a grey linen three-seat sofa with throw pillows, looking at a laptop. Nina: "This side table is nice, and it is on sale." Sam: "Add it to the list." Safe.
5. Close-up of Sam looking at a phone, his face tightening. Sam: "Wait. Did you move the money from the savings account?" Nina: "Only for the sofa. I told you last week." Tense, calm voices. Intense dialogue (rising).
6. Two shot, standing now. Sam, raising his voice: "You did not tell me! That was for the car!" Nina, louder: "You never listen to anything I say!" Both gesture sharply. Intense dialogue.
7. Close-up on Nina, angry and close to tears. Nina, shouting: "Fine! Send the sofa back then!" She throws a cushion onto the floor and walks out of frame. Intense dialogue.
8. Wide shot. Sam alone, sitting on the edge of the sofa with his head in his hands; silence, rain on the window. Somber.
9. Medium shot, later. Nina comes back with two cups of tea and sits beside him. Nina, softly: "I am sorry I yelled." Sam: "Me too. Let us keep the sofa." They both laugh quietly. Safe.

## Clip 3: Night Shift, Neo Lagos (sci-fi, split clip)

**Style line:** Cinematic sci-fi film, 16:9, near-future megacity at night, neon reflections on wet streets, holographic signs with abstract shapes only, anamorphic lens look, teal and amber color grade, realistic people, smooth camera moves.

**Cast:** KOFI, a man in his early 30s with short locs and a trimmed beard, wearing a charcoal techwear jacket and white sneakers. ZARA, his colleague and friend, a woman in her late 20s with a shaved head and silver earrings, wearing a long burgundy coat. A GUNMAN in a black armored jacket and a mirrored visor.

First half, brand safe (shots 1 to 5, about 40 seconds):

1. Wide shot. A glass-walled office high above the city at dusk. Kofi works at a white standing desk with a curved monitor, an ergonomic mesh chair beside him, a desk lamp and a small plant. Calm synth music. Safe.
2. Close-up. Kofi puts on sleek over-ear wireless headphones, nods to the music and closes his laptop. Safe.
3. Medium shot. Kofi zips up his techwear jacket, slings a black leather backpack over his shoulder and waves to Zara, who grabs her coat and a crossbody bag. Safe.
4. Wide shot. Kofi and Zara walk down a neon-lit street past food stalls and parked electric scooters, laughing; Kofi still wears his headphones around his neck. Safe.
5. Medium shot. Inside a warm, busy bar with brass lamps and leather stools, Kofi and Zara clink two glass tumblers and sit at the counter. Relaxed. Safe.

Second half, brand unsafe (shots 6 to 10, about 40 seconds):

6. Medium shot. The bar door slides open; the gunman steps in and raises a futuristic pistol. Patrons scream and dive for cover; music cuts out. Violence.
7. Fast handheld shot. The gunman fires bright energy bolts across the bar; glasses shatter, Kofi pulls Zara behind the counter. Violence.
8. Close-up. Kofi grabs a fallen pistol and fires back from behind the counter; the gunman staggers out of the door. Brief and fast. Violence.
9. Medium shot. Silence and smoke. Zara lies on the floor, a dark stain spreading on her coat; Kofi kneels beside her and holds her hand as her eyes close. No visible wound. Death or grief.
10. Wide shot. Kofi sits alone on the wet street outside the bar in the rain, headphones in his hands, staring at the ground; red police lights flash on the walls. Death or grief.

## Clip 4: Paper Moon (2D hand-drawn animation)

**Style line:** 2D hand-drawn animated short film, 16:9, soft watercolor backgrounds, clean ink lines, gentle limited animation, a small top-floor apartment at night with a round window showing a big pale moon. Original characters, romantic and calm.

**Cast:** IRIS, a young woman with a short black bob and freckles, wearing a yellow dress. TEO, a young man with wavy brown hair, wearing a blue shirt with rolled sleeves.

1. Wide shot. Iris sets a small round table with white plates, two wine glasses and a linen tablecloth, humming. Safe.
2. Close-up. Iris lights two candles in brass candle holders and switches on a paper lantern lamp. Safe.
3. Medium shot. Teo arrives with a bunch of flowers; Iris puts them in a glass vase. Both smile shyly. Safe.
4. Medium shot. They cook pasta together, Teo stirring a steel pot, Iris grating cheese, laughing when flour lands on Teo's nose. Safe.
5. Two shot. They eat dinner by the round window, the moon behind them, a record player turning softly. Safe.
6. Close-up. They dance slowly in the middle of the room; Iris rests her head on Teo's shoulder. Safe, romantic.
7. Close-up. They kiss passionately and stumble toward the bed, still fully clothed; the camera drifts to the window and the moon as the scene fades to dark. Sexual (implied, no nudity).
8. Wide shot, morning. Sunlight on the tidy room; Teo carries two mugs of coffee to the table by the window. Safe.

## After generating

1. Join each clip's shots in order (any editor, or `ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 96k clipN.mp4`) and keep each file under 25 MB.
2. Put the 4 files in `data/samples/` and note the tool's name, so its terms can go in `docs/data-sources.md`.
3. The rest follows "When the clips arrive" in the resume notes. For clip 3, check that pauses in shots 1 to 5 show ads and pauses in shots 6 to 10 show none.
