# moodboard-unpack

A Claude skill that turns a mood board, Pinterest board, or set of
visual references into a structured brand-experience brief — *world*,
mood adjectives, hashtags, named color theme, sonic palette, materials,
and product/brand directions.

For brand experience, product design, and creative direction work.

## What it does

You drag a handful of images into Claude (or paste a public board URL)
and ask for a mood unpack. Instead of a list of "what's on the board,"
you get a creative brief that names the world the references live
inside and gives you concrete next moves.

Example output structure:

```
WORLD               (a 2–3 sentence scene)
MOOD ADJECTIVES     (5–8, banned corporate-deck words)
HASHTAGS            (5–8, lowercase, including aesthetic-movement tags)
COLOR THEME         (named — "Bleached Coast" not "Warm Neutrals")
SONIC PALETTE       (specific sounds + 2–3 reference artists)
MATERIALS & TEXTURES
SENSES BEYOND VISION (touch, smell, weight…)
PRODUCT / BRAND DIRECTIONS (packaging · voice · what to avoid)
ADJACENT MOODS TO EXPLORE NEXT
```

## Install

The skill is a single markdown file. Pick the path that matches how you
use Claude:

### Claude Desktop or Claude Code (CLI)

```bash
mkdir -p ~/.claude/skills/moodboard-unpack
cp moodboard-unpack/SKILL.md ~/.claude/skills/moodboard-unpack/
```

That's it. No restart needed — Claude reads the skill on each new
conversation.

### Claude.ai (web)

Go to **Settings → Capabilities → Skills → Create new skill** and paste
the contents of `moodboard-unpack/SKILL.md`.

## Use

In any new Claude conversation:

**Best path** — drag images in:
1. Save 4–20 pins to your desktop (or screenshot the board)
2. Drag them into a Claude chat
3. Type something like *"Unpack this for product packaging"* or *"Give
   me a moodboard brief"*

**Alternative** — paste a URL:
```
Unpack this Pinterest board: https://www.pinterest.com/<user>/<board>/
```

Claude will try to fetch the page. Pinterest renders client-side so this
sometimes returns too little — if so, just drag the images in instead.

The skill optionally asks once if you have a *focus* (e.g. "product
packaging," "café interior," "music video"). Provide one for a slanted
brief, skip it for a general read.

## Why a skill, not a connector

This started as an MCP connector with full Pinterest API integration
(see `git log` for the archived implementation). The connector worked,
but distribution friction was high — every user needed Node, a Pinterest
developer app, and an OAuth flow. For a tool whose value is in the
*synthesis*, not the API plumbing, a skill is dramatically simpler:
one markdown file, no install dependencies, works for anyone.

## Sharing

The skill is a single file. To share with someone:

- **Send them the file** (`moodboard-unpack/SKILL.md`) and one line of
  install instructions, or
- **Point them at this repo**

No accounts, no auth, no hosting. They drop it in and it works.

## License

MIT.
