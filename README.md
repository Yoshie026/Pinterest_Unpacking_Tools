# moodboard-unpack

Turn a Pinterest board (or any set of visual references) into a
structured brand-experience brief — *world*, mood, named color theme,
sonic palette, materials, and product directions. For brand and product
design work where you want a creative brief, not a description.

Two ways to use it:

| | **Skill** | **Connector** |
|---|---|---|
| Setup | Copy 1 file | Install a `.dxt`, paste 1 token |
| Input | Drag images in | Type `/unpack <board-name>` |
| Pinterest API | No | Yes — auto-fetches your boards |
| Works in | Claude.ai, Desktop, Code | Claude Desktop only |
| Friction | Zero | 5 minutes once |

Pick the skill if you want to share it widely. Pick the connector if you
want to type a board name and have it just work.

---

## Example output

```
WORLD
A sun-warmed coastal villa, late afternoon. Linen curtains drift in
salt air. Time feels paused — someone has just stepped out for olives.

MOOD ADJECTIVES
unhurried · sun-soaked · monastic · salt-bleached · generous · grounded

HASHTAGS
#slowliving #wabisabi #linenandlimestone #earthtoned #coastalminimal

COLOR THEME — "Bleached Coast"
sand #E8DCC8 · terracotta #C97B4F · olive shadow #5C6B4A · bone #F5EFE3
· inkblue accent #2A3A4E

TYPOGRAPHY
- Family: humanist serif (Caslon, Lyon Text) paired with a quiet
  geometric sans (GT America, Söhne)
- Pairing: airy serif headlines, generous-leading sans body
- Tone: bookish, unhurried, slightly archival
- Avoid: rounded novelty sans, calligraphic script

IMAGERY DIRECTION
- Subject framing: still-life detail crops, half-empty rooms, hands at
  rest on tables
- Lighting: late-afternoon natural, soft directional from a window
- Treatment: warm-shifted, low contrast, fine 35mm grain
- Composition: asymmetric, generous whitespace, off-grid

SONIC PALETTE
- Distant cicadas, low and continuous
- Linen rustling against itself
- A single ceramic mug set on tile
References: Nils Frahm "Says", Khruangbin, Greek summer field recordings

MATERIALS & TEXTURES
lime-washed plaster · rough linen · unglazed terracotta · weathered teak

SENSES BEYOND VISION
- Warmth on stone, slightly cooler shade
- Faint olive oil and dried thyme
- Pleasingly heavy ceramics

PRODUCT / BRAND DIRECTIONS
- Packaging: matte recycled paperboard, terracotta print, never gloss
- Voice: short sentences. Confident, generous, never urgent.
- Avoid: chrome, neon, sans-serifs that look "tech"

ADJACENT MOODS TO EXPLORE NEXT
- Monastic — strip ornament, push toward rule and repetition
- Agrarian — dirt, baskets, ledger paper, working hands
- Taverna — louder, communal, candlelit
```

---

## Path A — Skill (no install)

### Install

**Claude Desktop / Claude Code:**

```bash
mkdir -p ~/.claude/skills/moodboard-unpack
cp moodboard-unpack/SKILL.md ~/.claude/skills/moodboard-unpack/
```

**Claude.ai (web):** Settings → Capabilities → Skills → Create new skill
→ paste contents of `moodboard-unpack/SKILL.md`.

### Use

In any new Claude chat:

1. Drag 4–20 images in (Pinterest screenshots, saved pins, anything)
2. Type *"unpack this for product packaging"* (focus optional)

That's it. Triggers on *unpack*, *moodboard*, *what's the vibe*,
*give me a brief*.

---

## Path B — Connector (Pinterest auto-fetch)

The connector is a Claude Desktop Extension that talks to the Pinterest
API for you. Once installed, you can refer to boards by name and Claude
fetches the pins itself.

### Install

1. **Get an access token** — go to
   <https://developers.pinterest.com/apps/> → your app → generate a
   token with scopes `boards:read,pins:read`. (Or run
   `cd connector && npm install && npm run auth` if you'd rather use
   the OAuth flow.)
2. **Install the extension** — open `connector/pinterest-mcp.dxt` (or
   build a fresh one with `cd connector && npm run dxt`)
3. **Paste the token** into the install dialog and click Install

### Use

In Claude Desktop:

```
/unpack metal_material_inspo
```

or natural language:

> Unpack my metal_material_inspo board for product packaging

The connector also exposes:

- `/board <name>` — quick board view (metadata + thumbnails)
- Tools: `list_boards`, `get_board`, `get_pin_images`, `board_brief`
  (if you want to drive things manually)

The access token lasts ~30 days. When it expires you'll see Pinterest
errors in chat — get a fresh token and reconfigure the connector.

---

## Repo layout

```
moodboard-unpack/
  SKILL.md            # Path A — the skill
connector/
  src/                # Path B — MCP server source
  manifest.json       # DXT manifest
  pinterest-mcp.dxt   # Built extension (after `npm run dxt`)
README.md
```

## Sharing

- **Skill** — send the `SKILL.md` file. Recipient drops it in
  `~/.claude/skills/moodboard-unpack/`. Done.
- **Connector** — send the `.dxt` file *plus* tell the recipient to
  create their own Pinterest app and generate a token. There's no way
  around per-user Pinterest credentials without hosting a remote MCP
  server, which costs money.

For a low-bar public release, the skill is the answer. The connector is
for power users.

## License

MIT.
