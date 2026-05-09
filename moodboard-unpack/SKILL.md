---
name: moodboard-unpack
description: Use when the user wants to turn a mood board, Pinterest board, or set of visual references into a structured brand-experience brief — world, mood adjectives, hashtags, named color theme, sonic palette, materials, and product directions. Triggers on phrases like "unpack this board", "moodboard for X", "what's the vibe of these images", "describe this aesthetic", "give me a brief from these refs", or when the user shares a batch of inspirational images and asks for analysis. For brand experience and product design work.
---

# Moodboard Unpack

Turn a set of visual references into a structured brand-experience brief
that a designer can act on. Don't summarize what's in the images —
translate them into a *world* the user can step into and develop further.

## Input

The user will provide one of:

- **Images dragged into the chat** (best). 4–20 images is ideal. Look at
  them as a single coherent set, not individual pictures.
- **A public Pinterest board URL** (e.g. `pinterest.com/<user>/<board>/`).
  Use WebFetch to load the page and study the visible thumbnails. If
  Pinterest's HTML is too sparse to extract enough images, say so and
  ask the user to drag the pins in instead — don't burn turns scraping.
- **Other URLs**: Are.na channels, Instagram grids, magazine scans on a
  webpage. Same approach — fetch, look, analyze.

## Before you write the brief

Ask exactly once:

> Got it. Any focus for this brief? (e.g. product packaging, café
> interior, editorial photoshoot, brand identity, music video).
> Skip if you want a general read.

If the user provides a focus, slant the SENSORY DETAILS and
PRODUCT/BRAND DIRECTIONS sections toward that use case. If they skip,
proceed without one.

## Synthesis principles

- **Specific beats general.** "Sun-bleached terracotta on shaded
  terrace" beats "warm tones." "Distant cicadas, single ceramic mug
  set on tile" beats "ambient sounds."
- **Borrow vocabulary from what you see.** If the images contain
  hand-lettered signage, use that flavor of language. If they're all
  industrial steel, write tighter sentences.
- **Banned words**: "modern," "elevated," "premium," "curated,"
  "iconic," "timeless," "luxurious," "sophisticated." These are
  corporate-deck filler. Find the specific word for what you actually
  see.
- **The world is the point.** A brief is good when the user could
  describe the same world to a stranger after reading it. It's bad if
  it just lists pin contents.

## Output format

Skip any preamble. Go straight into the brief, using these section
headers exactly, in this order:

```
WORLD
A 2–3 sentence scene description. Where are we? Time of day, season,
scale? What just happened or is about to happen? Write it like the
opening of a short story, not a brand statement.

MOOD ADJECTIVES
5–8 adjectives separated by " · ". Mix expected with surprising.

HASHTAGS
5–8 lowercase hashtags, space-separated. Include one or two naming an
aesthetic movement (#wabisabi, #brutalism, #cottagecore, #y2k,
#solarpunk, etc.) and the rest specific to this set.

COLOR THEME — "<2–3 word evocative palette name>"
4–6 most defining swatches as `<color name> <hex>`, separated by " · ".
Estimate hex codes from the images. The palette *name* should be a
phrase that captures the feeling, not just a description.
(Example: "Bleached Coast" not "Warm Neutrals".)

SONIC PALETTE
3–5 specific sound elements as a bulleted list. Be concrete (instrument,
source, environmental sound — not "calming music"). End with a line
"References:" naming 2–3 artists, albums, or recording types the user
could search.

MATERIALS & TEXTURES
4–6 cues separated by " · " (e.g. "lime-washed plaster · rough linen ·
unglazed terracotta · weathered teak").

SENSES BEYOND VISION
3 short bullets covering touch, smell, and one other (taste, weight,
temperature, ambient sound). One sensory image each, no explanation.

PRODUCT / BRAND DIRECTIONS
- Packaging or physical-form direction (one sentence)
- Voice/tone direction (one sentence)
- One thing to AVOID (one sentence — what would break the world)

ADJACENT MOODS TO EXPLORE NEXT
3 named directions, each with a one-line "why" — adjacent worlds to push
the user's thinking outward, not variations of the same set.
```

## After delivering the brief

End with one short follow-up question that pushes the work forward, e.g.:

- "Want me to push any of the adjacent moods into a full second brief?"
- "Want me to translate the COLOR THEME into a Midjourney prompt or a
  Figma palette?"
- "Want a tighter version of this for a one-page deck?"

Pick whichever feels most useful given the user's stated focus.

## Edge cases

- **Mixed/incoherent images**: if the references don't form a single
  world, say so and ask the user to either pick a subset or commit to
  one of the directions you can see. Don't fake coherence.
- **Too few images** (1–2): you can still attempt the brief but flag
  that the read is thin. Encourage adding more references.
- **NSFW/violent images**: decline politely, suggest they share the
  aesthetic references that *aren't* NSFW.
- **Pinterest URL won't load**: don't retry more than once. Ask for
  dragged-in images. Pinterest aggressively rate-limits/JS-renders.
- **Color hex codes are estimates** — note this once at the end of the
  COLOR THEME section if asked, otherwise just give your best read.
