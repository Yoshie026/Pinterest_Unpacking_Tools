# moodboard-unpack

A Claude tool for designers. Hand it a Pinterest board (or a pile of
saved images) and it returns the board's *essence* — not what's on it,
but what it's **secretly about**. The output is a structured brief you
can paste into a creative deck, brand doc, or AI image prompt.

It's for the moment between *"I have references"* and *"I have a
direction."*

## What you get

```
ESSENCE,
TENSIONS,
CONCEPT DIAGRAM,
COLOUR PALETTE,
TYPOGRAPHY,
SONIC PALETTE,
SEARCH HOOKS — for finding more references,
WORLD, MOOD ADJECTIVES, HASHTAGS, MATERIALS, OBJECTS, METAPHORS,
WHAT'S NOT HERE, PROVOCATIONS, ADJACENT WORLDS
```

## What's it for?

- **Brand briefs.** Translate a vague mood into hex codes, named
  typefaces, and material vocabulary you can hand to a team.
- **Set design & installations.** The OBJECTS, MATERIALS, and SONIC
  PALETTE sections double as spatial production cues — staging,
  projection, AR, or built environments.
- **Multi-deliverable campaigns.** When one concept has to live across
  packaging, web, motion, retail, and social — the brief becomes a
  shared vocabulary spine so every surface stays in the same world.
- **AI prompting.** Feed the ESSENCE + PALETTE into Midjourney or
  Sora as a base prompt, then iterate.
- **Brainstorming.** The PROVOCATIONS section is 5 questions written
  to push you sideways, not forward.
- **Reference hunting.** SEARCH HOOKS gives you specific neighborhoods,
  decades, and named photographers to paste into Pinterest, Are.na, or
  Google Images.

## Requirements

- **Claude Desktop** (free download) — Free tier works fine, you'll just
  hit message limits faster than Pro users.
- **For Path B only:** a free Pinterest developer account (5 min to set up).

## How to install

Two paths. Pick **one**.

### → Path A: I just want to drop in images and get a brief

Works in **any Claude** — Desktop, web, mobile. No API setup.

1. Download [`SKILL.md`](https://github.com/Yoshie026/Pinterest_Unpacking_Tools/blob/skill/moodboard-unpack/SKILL.md) from the `skill` branch of this repo.
2. Drop it in `~/.claude/skills/moodboard-unpack/SKILL.md` (Claude
   Desktop / Claude Code), or paste its contents into Claude.ai web
   under Settings → Capabilities → Skills.
3. Open a chat. Drag 4–20 images in. Type "*unpack this for product
   packaging*" (or any phrase like that — *unpack*, *moodboard*,
   *what's the vibe*).

That's it.

### → Path B: I want it to read my Pinterest boards directly

Works in **Claude Desktop only**. Installs as an extension.

> **Heads up:** Pinterest doesn't allow shared API credentials, so each
> user creates their own free Pinterest developer app. Takes about 5
> minutes, browser only — no payment, no review process. This is the
> same friction every Pinterest integration has (IFTTT, Zapier, etc.).

You'll need:
- A free Pinterest developer account (5 minutes)
- A Pinterest access token (5 minutes)
- The `.dxt` file from [Releases](../../releases/latest)

**Steps:**

1. **Create a Pinterest developer account**
   Sign up at <https://developers.pinterest.com/> if you don't already
   have one.

2. **Create a Pinterest app**
   - Go to <https://developers.pinterest.com/apps/> → *Create app*
   - Add redirect URI: `http://localhost:3000/callback`
   - Save the **App ID** and **App secret key**

3. **Get an access token**
   In your app dashboard, generate a token with scopes `boards:read`
   and `pins:read`. It starts with `pina_…`.

   **No "generate token" button?** Use the OAuth helper:

   ```bash
   git clone https://github.com/Yoshie026/Pinterest_Unpacking_Tools
   cd Pinterest_Unpacking_Tools/connector
   npm install
   cp .env.example .env
   # Paste your App ID and secret into .env
   npm run auth
   ```

   A browser opens → click *Approve* → token is saved to `.env`.

4. **Install the connector**
   - Download `pinterest-mcp.dxt` from [Releases](../../releases/latest)
   - Double-click it → paste your token → Install

5. **Use it**
   In any Claude Desktop chat:

   > unpack my-board-name

   or with a focus:

   > unpack my-board-name for web design project

   Or to see what boards you have:

   > show me my Pinterest boards

   *(Returns a visual grid of every board with its cover image.)*

## Tips

- **Add context after the board name.** *"unpack my-board-name I'm
  working on packaging for a print magazine"* — the brief slants
  toward your use case.
- **The PROVOCATIONS section is the point.** It's not summary, it's
  questions. Sit with them before you read the rest.
- **SEARCH HOOKS are paste-ready.** Copy a "Place" or a "Creator"
  straight into Pinterest's search.
- **Use ADJACENT WORLDS to escape your own taste.** If your brief
  feels too neat, run the adjacent world that scared you most.

## License

[MIT](LICENSE) — do anything you want with it.
