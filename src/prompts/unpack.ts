/**
 * Slash-command prompt: turn a Pinterest board into a structured
 * "mood unpack" — a brand-experience brief, not a data dump.
 *
 * Invocation in Claude:
 *   /unpack board:"metal_material_inspo" focus:"product packaging"
 *
 * The `board` argument accepts either a Pinterest board ID (a long
 * numeric string) or a board name — the prompt instructs Claude to
 * resolve the name via `list_boards` if it isn't already an ID.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const SYNTHESIS_BRIEF = `
You are unpacking a Pinterest mood board into a brand-experience brief
for a product/brand designer. Translate the board into a *world* the
user can step into and develop further — don't summarize which pins
are on it.

# Step 1 — Resolve the board

If the \`board\` argument looks like a Pinterest board ID (a long
numeric string with no spaces), use it directly. Otherwise, call
\`list_boards\` and find the board whose name best matches. If multiple
match, pick the one with the most pins. If none match, ask the user
which one they meant — don't guess.

# Step 2 — Gather

Call \`board_brief\` with the resolved board_id and \`max_pins: 16\`.
Look at the returned thumbnails as images, read pin titles/descriptions,
and study the aggregate_palette.

# Step 3 — Synthesize

Return ONLY the structured brief below. No preamble, no "here's what I
found." Use evocative, specific language — "sun-bleached terracotta on
shaded terrace" beats "warm tones." Be concrete. Avoid corporate-deck
adjectives ("modern," "elevated," "premium," "curated"). If a focus is
given, slant SENSORY DETAILS and PRODUCT DIRECTIONS toward that use case.

## Output format (use exactly these section headers, in this order)

WORLD
A 2–3 sentence scene description. Where are we? What time of day,
season, scale? What just happened or is about to happen? Write it
like the opening of a short story, not a brand statement.

MOOD ADJECTIVES
5–8 adjectives, separated by " · ". Mix expected and surprising. No
generic words ("beautiful," "elegant," "modern").

HASHTAGS
5–8 lowercase hashtags, space-separated. Include one or two that name
an aesthetic movement (e.g. #wabisabi, #brutalism, #cottagecore) and
the rest specific to this board.

COLOR THEME — "<give the palette a 2–3 word evocative name>"
List the 4–6 most defining swatches as: \`<name> <hex>\` separated by
" · ". Rename freely from the tool output to fit the world.

SONIC PALETTE
3–5 sound elements as a bulleted list. Be specific (instrument, source,
or environmental sound — not "calming music"). End with a line
"References:" naming 2–3 artists, albums, or recording types the user
could search to hear the world.

MATERIALS & TEXTURES
4–6 cues separated by " · " (e.g. "lime-washed plaster · rough linen").

SENSES BEYOND VISION
3 short bullets covering touch, smell, and one other (taste, weight,
temperature, ambient sound). One sensory image each, no explanation.

PRODUCT / BRAND DIRECTIONS
3 short bullets a designer can act on:
- Packaging or physical-form direction (one sentence)
- Voice/tone direction (one sentence)
- One thing to avoid (one sentence — say what would break the world)

ADJACENT MOODS TO EXPLORE NEXT
3 named directions, each with a one-line "why" — adjacent worlds to
push the user's thinking outward, not variations of the same board.
`.trim();

export function register(server: McpServer): void {
  server.prompt(
    "unpack",
    "Unpack a Pinterest board into a brand-experience brief: world, mood, named color theme, sonic palette, materials, and product directions.",
    {
      board: z
        .string()
        .describe(
          "Pinterest board name or ID. Names are resolved via list_boards; IDs are used directly.",
        ),
      focus: z
        .string()
        .optional()
        .describe(
          "Optional use-case slant — e.g. 'product packaging', 'editorial photoshoot', 'café interior'.",
        ),
    },
    ({ board, focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Unpack Pinterest board "${board}" into a mood-experience brief.`,
              focus ? `Focus: ${focus}.` : "",
              "",
              SYNTHESIS_BRIEF,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        },
      ],
    }),
  );
}
