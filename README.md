# moodboard-unpack

A Claude Desktop extension for designers. Point it at a Pinterest
board and it returns the board's *essence* — not what's on it, but
what it's **secretly about**. The output is a structured brief you
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

## Requirements

- **Claude Desktop** (free download) — Free tier works fine, you'll
  just hit message limits faster than Pro users.
- A free **Pinterest developer account** (5 min to set up — Pinterest
  doesn't allow shared credentials, so every user creates their own
  free dev app. Same friction every Pinterest integration has.)

## Install

You'll need three things:

- A Pinterest developer app *(5 min, browser only)*
- A Pinterest access token *(5 min, from the app dashboard)*
- The `.dxt` file from [Releases](../../releases/latest)

**Steps:**

1. **Create a Pinterest app**
   - Go to <https://developers.pinterest.com/apps/> → *Create app*
   - In the app's settings, add this redirect URI: `http://localhost:3000/callback`
   - Save the **App ID** and **App secret key**

2. **Get an access token**
   In your Pinterest app dashboard, look for an option to generate an
   access token (sometimes under *Configuration*, *API access*, or
   *Trial access*). Pick scopes `boards:read` and `pins:read`. Copy
   the token — it starts with `pina_…`.

   **If you can't find a "generate token" button** (Pinterest's UI
   shifts around), use the OAuth helper instead:
   ```bash
   git clone https://github.com/Yoshie026/Pinterest_Unpacking_Tools
   cd Pinterest_Unpacking_Tools/connector
   npm install
   cp .env.example .env
   # Open .env, paste your App ID and App secret key into the first two lines
   npm run auth
   ```
   A browser opens, you click *Approve*, and the token is written to
   `.env`. Copy it from there.

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

Send them this repo's URL — they download the `.dxt` from Releases
and follow the install above. Heads up: they'll need to make their
own free Pinterest developer app (Pinterest doesn't allow shared
API credentials).

## License

[MIT](LICENSE) — do anything you want with it.
