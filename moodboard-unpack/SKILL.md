---
name: moodboard-unpack
description: Use when the user wants to abstract a Pinterest board, mood board, or set of visual references into a brainstorming brief — essence, productive tensions, ASCII concept diagram, named color palette, typography, materials, objects, metaphors, search hooks (places/eras/creators), missing elements, and brainstorm provocations. Triggers on "unpack [board name]", "unpack this board", "moodboard for X", "abstract this", "find themes in this board", "what's the vibe", "give me a brief from these refs". For brand experience, product design, and lateral creative thinking.
---

# Moodboard Unpack

Translate a set of visual references into an *abstraction* a designer can
brainstorm with. Don't describe what's in the images — extract what
they're *secretly about*. Surface productive tensions, lateral metaphors,
and concrete handles for finding more references.

## Input — three modes

1. **Pinterest board name or ID.** If the Pinterest Unpacking Connector
   is installed (tools `list_boards` and `board_brief` are available),
   use them:
   - Call `list_boards` if the user gave a name; match the closest one.
   - Call `board_brief` with `max_pins: 8` to get metadata + thumbnails.
   - Look at the returned thumbnails as images, read pin
     titles/descriptions for additional signal.
   This is the preferred path for any Pinterest board reference. If the
   connector isn't installed, ask the user to drag pins into the chat
   instead — don't try to scrape Pinterest URLs (heavy JS, rate-limited).

2. **Images dragged into the chat.** 4–20 images is ideal. Treat them as
   one coherent set, not individual pictures.

3. **Other URLs** (Are.na channels, Instagram grids, magazine scans on a
   webpage). Use WebFetch.

## Before you write

NO preamble. Don't say "let me check," "I don't have it in front of me
yet," or "I'll look this up." Just call the tools, look at the images,
and produce the brief. If the user provided a focus (e.g. "for product
packaging" or "for editorial photography"), bend PROVOCATIONS and
ADJACENT WORLDS toward that use case. Otherwise produce a general read.

## Synthesis principles

- **Specific beats general.** "Hammered brass · oil-stained denim" beats
  "industrial materials." "Naoshima boat sheds" beats "Japan." "1970s
  Japanese Metabolism" beats "vintage."
- **Borrow vocabulary from the images.** If the board is hand-lettered
  signage, use that flavor of language. If it's industrial steel, write
  tighter sentences.
- **Banned words**: "modern," "elevated," "premium," "curated," "iconic,"
  "timeless," "luxurious," "sophisticated," "minimalist." Corporate-deck
  filler. Find the specific word for what you actually see.
- **Tensions over coherence.** A board is interesting because of its
  productive contradictions. Find them. Name them. Don't smooth them
  into a single neat vibe.

## Output format

Skip preamble. Start at ESSENCE. Use these section headers exactly, in
this order:

ESSENCE
One sentence. The irreducible idea. Format: "X meets Y in Z" or "a
study in <tension>." This is what the board is *secretly* about, not
what it depicts.

TENSIONS
2–3 productive contradictions. One per line:
  <thing A>  ⇄  <thing B>
    one short line on what the contradiction is doing

CONCEPT DIAGRAM
A small ASCII diagram (5–10 lines) showing the structural relationship.
Use spectrums, arrows, boxes — whatever fits. Examples:

  RIGID  ─────×─────  FLOWING

  or:

  [ chrome ] ──reflects──▶ [ world ]
        ▲                       │
        └── corrodes into ◀─────┘

  or a 2×2:

           +mass
            │
  −polish ──┼── +polish
            │
           −mass

PALETTE — <evocative 2–3 word name>
4–6 swatches estimated from the images. Format:
`<color name> #HEX` · `<color name> #HEX` · …
The palette name is a phrase that names the feeling ("Burnt Mirror"),
not a description ("Cool Greys").

TYPOGRAPHY
- Family: 2 named typefaces — a heading face and a body face.
  Be specific (e.g. "GT America Mono / Söhne Buch," "Right Grotesk +
  Caslon Italic"), not categories ("geometric sans").
- Tone: 2–3 adjectives describing the type's voice.
- Avoid: one type direction that would break the world.

MATERIALS
4–6 specific textures or surfaces, separated by " · ". Touchable and
namable. Pick the kind of material a fabricator could quote you a
price for. No generic words like "textured," "matte," "industrial."

OBJECTS
3–5 specific artifacts that belong in this world. Choose objects that
*embody* the essence rather than illustrate it. Surprising over
obvious. Format: noun + qualifier, one per bullet.

MOOD ADJECTIVES
5–8 adjectives separated by " · ". Mix expected with surprising. Skip
generic words ("beautiful," "elegant," "modern").

HASHTAGS
5–8 lowercase hashtags space-separated. Include 1–2 naming an aesthetic
movement (#wabisabi, #brutalism, #y2k, #solarpunk, etc.) and the rest
specific to this set.

SONIC PALETTE
3–5 specific sound elements as a bulleted list. Concrete (instrument,
source, environmental sound — not "calming music"). End with a line
"References:" naming 2–3 artists, albums, or recording types the user
could search.

METAPHORS
Three different lenses on this board, each one phrase:
- If this board were a sound: …
- If this board were a creature/entity: …
- If this board were a place: …
Pick unexpected pairings.

SEARCH HOOKS
Concrete handles the user can paste into Pinterest, Are.na, or Google
Images to find more references. Be specific. "Neighborhoods, not
countries. Decades, not 'vintage.' Named individuals, not 'a
photographer.'"
- Places: 3–4 specific locations (e.g. "Naoshima boat sheds," "Kowloon
  Walled City," "Marfa, TX").
- Eras / movements: 2–3 named cultural moments (e.g. "1970s Japanese
  Metabolism," "early-2000s blogspot dark academia," "post-Soviet
  Brutalism").
- Creators: 2–3 specific photographers, designers, directors, or artists
  whose work hits the same nerve (e.g. "Hiroshi Sugimoto," "Naoto
  Fukasawa," "Roni Horn").
- Queries: 2–3 search strings tuned to surface non-obvious results.

WHAT'S NOT HERE (but probably should be)
3 missing elements that would deepen or complete the world. Force
lateral thinking — pick things the board wouldn't think to include.

PROVOCATIONS
5 open brainstorm questions (not yes/no). Push the user's thinking
outward. Examples (don't copy — generate fresh for this board):
- What's the smallest object that captures this whole vibe?
- What's the luxury version vs. the poverty version of this aesthetic?
- What sound enters the room when this material is touched?
- What would 100 years of weathering do to this?
- What would offend this board?

ADJACENT WORLDS
3 lateral directions, each as one short phrase + a one-line "why this
opens new ground." Pick worlds that share an underlying principle but
look completely different from this one. Avoid variations of the same
vibe.

## Edge cases

- **Pinterest connector not installed**: do NOT try to scrape Pinterest
  via WebFetch (heavy JS, rate-limited). Tell the user to either install
  the Pinterest Unpacking Connector or drag pins into the chat as images.
- **Pinterest auth expired**: connector tools will fail with a 401-style
  error. Tell the user to reconnect Pinterest in Claude's connector
  settings, or to drag pins in instead. Don't keep retrying.
- **Mixed/incoherent images**: if the references don't form a single
  world, say so and ask the user to pick a subset or commit to one
  direction. Don't fake coherence.
- **Too few images** (1–2): attempt the brief but flag that the read
  is thin and could change with more references.
- **Color hex codes are estimates** from thumbnails — note this once if
  the user asks for exact codes.
- **NSFW/violent images**: decline politely.

## After delivering the brief

End with one short follow-up that pushes the work forward. Pick
whichever feels most useful given the board:

- "Want me to push any of the ADJACENT WORLDS into a fresh unpack?"
- "Want a Midjourney prompt distilled from the ESSENCE?"
- "Want to translate the PALETTE into a Figma color set or hex export?"
- "Want a tighter one-page version of this for a deck?"
- "Want me to riff on any of the PROVOCATIONS specifically?"
