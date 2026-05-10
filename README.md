# moodboard-unpack

A Claude tool for designers. Hand it a Pinterest board (or a pile of
saved images) and it returns the board's *essence* — not what's on it,
but what it's **secretly about**. The output is a structured brief you
can paste into a creative deck, brand doc, or AI image prompt.

It's for the moment between *"I have references"* and *"I have a
direction."*

## What you get

```
ESSENCE
A study in the bureaucratic sublime — institutional documentation
meets quiet wonder.

TENSIONS
Cold spec sheet ⇄ Warm artefact
  clinical forms carrying romantic content; the mundane made monumental.
Catalogued ⇄ Unknowable
  everything labelled, nothing fully explained.

CONCEPT DIAGRAM
        DOCUMENTED
            │
 STERILE ───┼─── POETIC
   (Apollo  │   (Star Field
   flight   │    stamp)
   plan)    │
       UNDOCUMENTED

PALETTE — "Filed Under Green"
ledger cream #F4EFE2 · stamp red #C8412A · platform green #0E8A3C ·
steel grey #8E9591 · carbon black #161616 · folder kraft #B8A57E

TYPOGRAPHY
- Family: Argile Grotesk / Söhne Mono
- Tone: forensic, dignified, slightly square-shouldered
- Avoid: humanist serifs with calligraphic flourish

SONIC PALETTE
- Reel-to-reel tape hum, fluorescent ballast buzz
- Mechanical typewriter strikes spaced over silence
References: Boards of Canada — Geogaddi; Mark Fell — Multistability

SEARCH HOOKS — for finding more references
- Places: Hamburg HafenCity U-Bahn · Tsukiji wholesale ticket booths ·
  Brasília Esplanada ministries
- Eras: 1970s Japanese stamp design · East German VEB technical graphics
- Creators: Yusaku Kamekura · Massimo Vignelli · Karel Martens

…plus WORLD, MOOD ADJECTIVES, HASHTAGS, MATERIALS, OBJECTS, METAPHORS,
WHAT'S NOT HERE, PROVOCATIONS, ADJACENT WORLDS.
```

Real output from a board called `ontrep_ref` (an archival print site
mood board). Not generic — picks up specifics like *Hamburg HafenCity
U-Bahn* and *Yusaku Kamekura* because the board contained signals
pointing there.

## What's it for?

- **Brand briefs.** Translate a vague mood into hex codes, named
  typefaces, and material vocabulary you can hand to a team.
- **Live performance / set design.** Run with `focus: live visuals` and
  the OBJECTS / SONIC PALETTE / ADJACENT WORLDS sections bend toward
  staging.
- **AI prompting.** Feed the ESSENCE + PALETTE into Midjourney or
  Sora as a base prompt, then iterate.
- **Brainstorming.** The PROVOCATIONS section is 5 questions written
  to push you sideways, not forward.
- **Reference hunting.** SEARCH HOOKS gives you specific neighborhoods,
  decades, and named photographers to paste into Pinterest, Are.na, or
  Google Images.

## How to install

Two paths. Pick **one**.

### → Path A: I just want to drop in images and get a brief

Works in **any Claude** — Desktop, web, mobile. No API setup.

1. Download [`SKILL.md`](moodboard-unpack/SKILL.md) from this repo.
2. Drop it in `~/.claude/skills/moodboard-unpack/SKILL.md` (Claude
   Desktop / Claude Code), or paste its contents into Claude.ai web
   under Settings → Capabilities → Skills.
3. Open a chat. Drag 4–20 images in. Type "*unpack this for product
   packaging*" (or any phrase like that — *unpack*, *moodboard*,
   *what's the vibe*).

That's it.

### → Path B: I want it to read my Pinterest boards directly

Works in **Claude Desktop only**. Installs as an extension.

You'll need:
- A free Pinterest developer account (5 minutes)
- A Pinterest access token (5 minutes)
- The `.dxt` file from [Releases](../../releases/latest)

**Steps:**

1. **Create a Pinterest app**
   - Go to <https://developers.pinterest.com/apps/> → *Create app*
   - In the app's settings, add this redirect URI: `http://localhost:3000/callback`
   - Save the **App ID** and **App secret key**

2. **Get an access token**
   In the same Pinterest app dashboard, generate a test token with
   scopes `boards:read` and `pins:read`. Copy it.

   *(Alternative if you'd rather use OAuth: `cd connector && npm install
   && npm run auth` — opens a browser, writes the token to `.env`.)*

3. **Install the connector**
   - Download `pinterest-mcp.dxt` from [Releases](../../releases/latest).
   - Double-click it. Claude Desktop opens a config window.
   - Paste your access token. Click Install.

4. **Use it**
   In any Claude Desktop chat:

   > unpack my metal_material_inspo board

   or:

   > unpack ontrep_ref for live performance visuals

   Or if you want to see what boards you have:

   > show me my Pinterest boards

   *(Returns a visual grid of every board with its cover image.)*

## Tips

- **Add context after the board name.** *"unpack ontrep_ref I'm
  working on packaging for a print magazine"* — the brief slants
  toward your use case.
- **The PROVOCATIONS section is the point.** It's not summary, it's
  questions. Sit with them before you read the rest.
- **SEARCH HOOKS are paste-ready.** Copy a "Place" or a "Creator"
  straight into Pinterest's search.
- **Use ADJACENT WORLDS to escape your own taste.** If your brief
  feels too neat, run the adjacent world that scared you most.

## When the Pinterest token expires

Pinterest tokens last ~30 days. When yours dies, you'll see auth errors
in chat. Generate a new token, then **Settings → Connectors → Pinterest
Unpacking Connector → Configure** and paste the new one.

## Sharing this with someone

- **Skill path** — send them `SKILL.md`. They drop it in their
  `~/.claude/skills/` folder. Done.
- **Connector path** — send them this repo's URL. Heads up: they'll
  need to make their own Pinterest developer app (Pinterest doesn't
  let me embed credentials in distributed apps).

## License

[MIT](LICENSE) — do anything you want with it.
