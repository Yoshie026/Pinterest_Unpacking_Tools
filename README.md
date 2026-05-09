# moodboard-unpack

A Claude skill that turns a set of visual references into a
brand-experience brief — *world*, mood, named color theme, sonic
palette, materials, and product directions. For brand and product
design work, where you want a creative brief, not a description.

## What you get

Drag 4–20 images into a Claude chat, ask for a mood unpack, and you'll
get something like this:

```
WORLD
A sun-warmed coastal villa, late afternoon. Linen curtains drift in
salt air. Time feels paused — someone has just stepped out for olives.

MOOD ADJECTIVES
unhurried · sun-soaked · monastic · salt-bleached · generous · grounded

HASHTAGS
#slowliving #wabisabi #linenandlimestone #earthtoned #coastalminimal
#mediterraneanmodern

COLOR THEME — "Bleached Coast"
sand #E8DCC8 · terracotta #C97B4F · olive shadow #5C6B4A · bone #F5EFE3
· inkblue accent #2A3A4E

SONIC PALETTE
- Distant cicadas, low and continuous
- Linen rustling against itself
- A single ceramic mug set on tile
- One nylon-string guitar, very far away
References: Nils Frahm "Says", Khruangbin, Greek summer field recordings

MATERIALS & TEXTURES
lime-washed plaster · rough linen · unglazed terracotta · weathered teak
· hammered brass

SENSES BEYOND VISION
- Warmth on stone, slightly cooler shade
- Faint olive oil and dried thyme
- Pleasingly heavy ceramics

PRODUCT / BRAND DIRECTIONS
- Packaging: matte recycled paperboard, deep terracotta print, no gloss
- Voice: short sentences. Confident, generous, never urgent.
- Avoid: chrome, neon, sans-serifs that look "tech"

ADJACENT MOODS TO EXPLORE NEXT
- Monastic — strip ornament, push toward rule and repetition
- Agrarian — dirt, baskets, ledger paper, working hands
- Taverna — louder, communal, candlelit, less restraint
```

You can paste this into a brief, feed the COLOR THEME into Midjourney,
or hand it to a creative team.

## Install

### Claude Desktop or Claude Code

```bash
mkdir -p ~/.claude/skills/moodboard-unpack
cp moodboard-unpack/SKILL.md ~/.claude/skills/moodboard-unpack/
```

No restart needed.

### Claude.ai (web)

Settings → Capabilities → Skills → **Create new skill** → paste the
contents of `moodboard-unpack/SKILL.md`.

## Use

Open any new Claude conversation and either:

- **Drag images in** (best). Save 4–20 pins from a Pinterest board to
  your desktop, drop them in, and ask: *"Unpack this for product
  packaging."* The focus is optional.
- **Paste a public board URL**. Claude will try to fetch it; Pinterest's
  HTML is sparse so this sometimes returns too little — if so, drag the
  images in instead.

That's it. Skill triggers on phrases like *unpack*, *moodboard*,
*what's the vibe*, *give me a brief*.

## Share

The skill is one markdown file. Send it to a friend, or point them at
this repo. No accounts, no auth, no hosting. They drop it in and it
works.

## What's in this repo

```
moodboard-unpack/SKILL.md   # the skill itself
README.md                   # this file
```

The git history also contains an earlier MCP-connector implementation
(`git log` to see). It worked, but required Node + a Pinterest developer
account + OAuth — too much friction for the value. The skill keeps the
useful 90% (the synthesis) and drops the painful 10% (the API plumbing).
