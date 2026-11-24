# Video generation prompts for the 4 sample clips

Prompts for a text-to-video tool (Veo 3, Sora 2, Kling, Runway or similar) to make the 4 AI-generated sample clips. The clips are light and optimistic: no violence, no death, no sexual content. Where an ad must be held back, the reason is mild and everyday: a child on screen, a small kitchen cut, a heated but friendly argument, or a cartoonish laser gunfight in which no one is hurt.

## Length

Video tools make fixed-length shots (Veo 3: 8 s, Kling: 5 or 10 s, Sora 2: up to 20 s), so the length of a clip is set by the shot count, not by the prompt. Every clip below has 12 shots of 8 s, about 96 seconds. With a 10 s tool, use 10 s per shot (about 2 minutes); with a 5 s tool, generate each shot twice as a continuation. After joining, `ffprobe` gives the exact duration, which goes into the manifest anyway.

| Clip | Look | Safe scenes for ads | Scenes where the ad is held back |
|---|---|---|---|
| 1 Breakfast Rush | 3D animation | Kitchen goods | Child at the table, small cut on a finger |
| 2 The New Sofa | Live action, dialogue | Living room furniture | A loud argument that ends in a laugh |
| 3 Night Shift, Neo Lagos | Sci-fi, live action | First half: office, headphones, jacket, bag, bar | Second half: a laser gunfight in which no one is hurt |
| 4 Garden Party | 2D hand-drawn animation | Garden furniture, tableware, decor | None: every pause should show an ad |

Clip 3 is the split clip: ads show on a pause in its first half and are held back in its second half. Clip 4 is the control: a clip where nothing should be held back.

## Rules for every shot

- Paste the clip's **style line** and **cast** at the start of every shot prompt, unchanged, so faces, rooms and light stay the same across shots. If the tool supports a reference image or "character" feature, generate the cast once and reuse it.
- Each shot holds one setting and one action. A cut between shots is a new scene for the pipeline, so do not ask for two places in one shot.
- Show ordinary, unbranded goods clearly in the safe shots: pans, kettles, mugs, lamps, sofas, rugs, headphones, jackets, sneakers, bags, glasses, chairs.
- Always add: "No logos, no readable brand names, no on-screen text, no subtitles, no watermark."
- Mood: warm, hopeful, funny. Every clip ends on a happy note.
- Audio: ambient sound and music fitting the look on every shot. Spoken lines only where a shot lists them.
- Target per clip: 16:9, 1080p or 720p, under 25 MB after export.

## Clip 1: Breakfast Rush (3D animation, 12 x 8 s)

**Style line:** Stylized 3D animated short film, 16:9, soft rounded characters with big expressive eyes, warm saturated colors, gentle morning light, smooth camera moves, a cozy kitchen with wooden counters, pastel tiles and plants on the window sill. Original characters, cheerful mood.

**Cast:** MAYA, a cheerful mother with dark curly hair in a bun, wearing a mustard sweater. LEO, her 7-year-old son with messy brown hair and a striped t-shirt. PICKLE, their small round orange cat.

1. Wide shot. Sunrise over the kitchen; Maya opens the curtains and stretches, Pickle yawns on the counter. Safe.
2. Medium shot. Maya fills a white electric kettle at the sink and sets it on its base. Safe.
3. Close-up. Maya pours steaming water into a glass pour-over coffee maker; steam curls into little swirls. Safe.
4. Medium shot. Maya flips pancakes in a black frying pan; one lands perfectly, she does a tiny victory dance. Safe.
5. Medium shot. Maya sets ceramic plates, colorful mugs and cloth napkins on a round wooden table. Safe.
6. Medium shot. Leo runs in in his pajamas, climbs onto a chair and starts drawing with crayons, humming; the camera stays on him. Child focused.
7. Close-up. Leo proudly holds up a drawing of Pickle; Pickle jumps onto the table and knocks the crayons over, Leo giggles. Child focused.
8. Close-up. At the counter Maya's knife slips while slicing an apple; she says "Ouch!", a small cut on her fingertip with a drop of red. Medical (mild).
9. Medium shot. Leo hurries over with a first-aid box and carefully puts a bandage with little stars on Maya's finger; she laughs and hugs him. Child focused.
10. Medium shot. Maya carries a stack of pancakes and a jug of syrup to the table. Safe.
11. Close-up. Pickle sniffs a pancake on a plate and gets syrup on its nose. Safe.
12. Wide shot. Maya and Leo eat breakfast by the sunny window, laughing; Pickle naps on a knitted blanket on a chair. Safe.

## Clip 2: The New Sofa (live action, dialogue, 12 x 8 s)

**Style line:** Warm naturalistic comedy, 16:9, golden evening lamp light, static and slow-push camera, realistic people, a cozy living room with a large window, wooden floor and a few cardboard boxes.

**Cast:** SAM, a man in his early 40s with a short beard, wearing a navy flannel shirt. NINA, a woman in her late 30s with a straight black bob, wearing a mustard cardigan.

1. Wide shot. Sam and Nina open the door to their new, almost empty living room and look around, delighted. Nina: "It is ours!" Safe.
2. Medium shot. Sam and Nina stand holding mugs. Nina: "I think the sofa goes under the window." Sam: "Then the lamp has nowhere to go." Safe.
3. Medium shot. Nina unrolls a large woven wool rug across the floor. Nina: "See? It already feels warmer in here." Sam: "It does. I take it back." Safe.
4. Medium shot. Sam assembles a tall brass floor lamp and switches it on; warm light fills the corner. Sam: "Better?" Nina: "Much better." Safe.
5. Two shot. They sit on a grey linen three-seat sofa with throw pillows, scrolling a laptop. Nina: "This side table is nice, and it is on sale." Sam: "Add it to the list." Safe.
6. Medium shot. Sam hangs a large framed print on the wall; Nina tilts her head. Nina: "Left. No, your other left." Safe.
7. Close-up of Sam reading a delivery note, eyebrows rising. Sam: "Wait, we ordered two sofas?" Nina: "No, you ordered two sofas!" Voices rising. Intense dialogue.
8. Two shot, standing. Both talking over each other, loud and animated. Sam: "You clicked buy!" Nina: "You said click buy!" Intense dialogue.
9. Close-up on Nina, arms crossed, very loud. Nina: "Then you can sleep on the second one!" Intense dialogue.
10. Two shot. A pause; they look at each other, then both burst out laughing. Safe.
11. Wide shot. The doorbell rings; two delivery workers carry in a second, identical sofa and set it down facing the first. Safe.
12. Wide shot. Sam and Nina sit on facing sofas with their feet up on a coffee table between them, clinking mugs. Sam: "Honestly? I love it." Safe.

## Clip 3: Night Shift, Neo Lagos (sci-fi, split clip, 12 x 8 s)

**Style line:** Cinematic sci-fi action comedy, 16:9, bright and hopeful near-future megacity at night, clean neon reflections on wet streets, holographic signs with abstract shapes only, anamorphic lens look, teal and amber color grade, realistic people, playful upbeat synth music.

**Cast:** KOFI, a man in his early 30s with short locs and a trimmed beard, wearing a charcoal techwear jacket and white sneakers. ZARA, his friend and colleague, a woman in her late 20s with a shaved head and silver earrings, wearing a long burgundy coat. A friendly service ROBOT bartender with a round screen face.

First half, brand safe (shots 1 to 6, about 48 seconds):

1. Wide shot. A glass-walled office high above the city at dusk, delivery drones gliding past. Kofi works at a white standing desk with a curved monitor and an ergonomic mesh chair. Safe.
2. Close-up. Kofi puts on sleek over-ear wireless headphones, nods to the music and closes his laptop with a satisfied smile. Safe.
3. Medium shot. Kofi zips up his techwear jacket and slings a black leather backpack over his shoulder; Zara grabs her coat and a crossbody bag. Zara: "Finally. First round is on me." Safe.
4. Wide shot. Kofi and Zara walk down a lively neon street past food stalls and parked electric scooters, laughing; Kofi wears his headphones around his neck. Safe.
5. Medium shot. Inside a warm, busy bar with brass lamps and leather stools, the robot bartender slides two glass tumblers to them. Safe.
6. Two shot. Kofi and Zara clink glasses and start an excited conversation. Kofi: "Okay, hear me out: a jetpack for pigeons." Zara laughs. Safe.

Second half, ad held back (shots 7 to 12, about 48 seconds). Played as an action comedy: no one is hurt, no blood, no injuries shown.

7. Hard cut, text-free time jump: the same two friends at the same counter much later, a row of empty glasses in front of them, both tipsy and giggling. Kofi: "Pigeons... with tiny helmets." Safe so far.
8. Medium shot. The door slides open; a sullen man in a black armored jacket and a mirrored visor walks up to Kofi and raises a chunky futuristic laser pistol. Music cuts out. Violence.
9. Fast handheld shot. The man fires bright red laser beams around the bar; every shot misses, bottles and neon signs spark, patrons duck behind tables, Kofi wobbles out of the way by pure luck. Violence.
10. Medium shot. Zara sneaks up behind the man, swings a bar stool and bonks him on the helmet with a cartoonish clang; he spins, drops the pistol and slumps to the floor, knocked out, stars of light around his visor. No blood. Violence.
11. Medium shot. The robot bartender rolls over, picks the man up and carries him out of the door; patrons stand up and applaud Zara, who takes a bow. Safe.
12. Wide shot. Kofi and Zara climb back onto their stools; the robot bartender slides them two fresh drinks on the house, and they clink glasses, laughing. Safe.

## Clip 4: Garden Party (2D hand-drawn animation, control clip, 12 x 8 s)

**Style line:** 2D hand-drawn animated short film, 16:9, soft watercolor backgrounds, clean ink lines, gentle limited animation, a sunny back garden with a wooden fence, fruit trees and string lights. Original characters, cheerful mood.

**Cast:** IRIS, a young woman with a short black bob and freckles, wearing a yellow sundress. TEO, a young man with wavy brown hair, wearing a blue shirt with rolled sleeves. BISCUIT, a fluffy white dog.

1. Wide shot. Morning sun over the garden; Iris carries a folding wooden table onto the lawn. Safe.
2. Medium shot. Teo hangs string lights between two trees from a step ladder; Biscuit watches. Safe.
3. Medium shot. Iris spreads a linen tablecloth and sets white plates and glass tumblers. Safe.
4. Close-up. Iris arranges sunflowers in a glass vase in the middle of the table. Safe.
5. Medium shot. Teo grills vegetables on a small charcoal grill, flipping them with steel tongs. Safe.
6. Medium shot. Iris pours lemonade from a glass pitcher; a bee lands on the rim and she laughs. Safe.
7. Wide shot. Friends arrive through the garden gate carrying a cake box and a picnic basket; everyone hugs. Safe.
8. Medium shot. Everyone sits on mismatched wooden chairs and cushions around the table, passing bowls of salad. Safe.
9. Close-up. Biscuit steals a sausage from the grill and runs off; Teo chases him around the tree. Safe.
10. Medium shot. Iris lights candles in glass lanterns as the sun sets. Safe.
11. Wide shot. The string lights switch on; everyone cheers. Safe.
12. Wide shot. Iris and Teo sit on a garden bench under the lights with Biscuit asleep between them, watching the stars. Safe.

## After generating

1. Join each clip's shots in order (any editor, or `ffmpeg -f concat -safe 0 -i list.txt -c:v libx264 -crf 26 -preset slow -c:a aac -b:a 96k clipN.mp4`), check the length with `ffprobe` and keep each file under 25 MB.
2. Put the 4 files in `data/samples/` and note the tool's name, so its terms can go in `docs/data-sources.md`.
3. The rest follows "When the clips arrive" in the resume notes. For clip 3, check that pauses in shots 1 to 6 show ads and pauses in shots 7 to 12 show none; for clip 4, that every pause shows an ad.
