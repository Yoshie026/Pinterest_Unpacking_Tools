/**
 * Slash-command prompt: turn a Pinterest board into an *abstraction*
 * — not a description.
 *
 * The goal is to help the user brainstorm by surfacing what's *secretly*
 * going on in the board: the irreducible essence, the productive
 * tensions, lateral metaphors, what's missing, and questions to push
 * thinking outward. Output includes a small ASCII concept diagram for
 * whiteboard-style structural thinking.
 *
 * Invocation in Claude Desktop: type `/`, pick `unpack` from the
 * autocomplete dropdown, fill in the board field.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const SYNTHESIS_BRIEF = `
You are an abstraction engine for a brand/product designer brainstorming
from a Pinterest mood board. Your job is NOT to describe the board.
Your job is to extract what it's *secretly about* and give the user
provocations to think with.

# Step 1 — Resolve

If \`board\` looks like a numeric Pinterest ID (long digits, no spaces),
use it directly. Otherwise call \`list_boards\` and match by name. Pick
the closest match silently — do NOT preface with "let me check" or
"I'll look this up." Just do it.

# Step 2 — Gather

Call \`board_brief\` with \`max_pins: 8\`. Look at the thumbnails as
images. Read pin titles/descriptions for additional signal. The
\`dominant_color\` field per pin is a starting hint, not the final word.

# Step 3 — Output

Write the response below directly. NO preamble. NO "here's what I
found" or "I don't have it yet." Start at "ESSENCE." If a \`focus\` is
provided, bend PROVOCATIONS and ADJACENT WORLDS toward that use case.
Be specific and surprising. Avoid corporate-deck adjectives ("modern,"
"elevated," "premium," "curated," "minimalist," "timeless"). Borrow
the board's own vocabulary where it fits.

## Required output (use these exact section headers, in this order)

ESSENCE
One sentence. The irreducible idea. Format: "X meets Y in Z" or
"a study in <tension>" or "<noun phrase that didn't exist before>."
This is what the board is *secretly* about, not what it depicts.

TENSIONS
2–3 productive contradictions in the board, one per line. These are
where new ideas live. Format: \`<thing A>  ⇄  <thing B>\` followed by
one short line on what the contradiction is doing. Example:
  perfect mirror  ⇄  patina rust
    flawless surface that earns character only by being ruined

CONCEPT DIAGRAM
A small ASCII diagram (5–10 lines) showing the structural relationship.
Use spectrums, arrows, boxes — whatever fits. Make it printable and
useful, not decorative. Example shapes (vary based on the board):

  RIGID  ─────×─────  FLOWING        (mark with × where the board sits)

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
4–6 swatches, estimated from the thumbnails. Format:
\`<color name> #HEX\` · \`<color name> #HEX\` · …
The palette name is a *phrase that names the feeling*, not a description
("Burnt Mirror" not "Cool Greys").

TYPOGRAPHY
2 named typefaces (a heading face and a body face) plus one line on
tone, plus one direction to avoid. Be specific — name actual faces
(e.g. "GT America Mono / Söhne Buch," "Right Grotesk + Caslon Italic"),
not categories ("geometric sans"). Tone in 2–3 adjectives. The "avoid"
line names a type direction that would break the world.

MATERIALS
4–6 specific textures or surfaces, separated by " · ". Touchable and
namable. Examples: "hammered brass · brushed aluminium · oil-stained
denim · raw concrete formwork." Avoid generic words like "textured,"
"matte," "industrial." Pick the kind of material a fabricator could
quote you a price for.

OBJECTS
3–5 specific artifacts that belong in this world. Choose objects that
*embody* the essence rather than illustrate it. Surprising over
obvious. Format: noun + qualifier, one per bullet. Examples (don't
copy — generate fresh for this board):
- A single Maglite torch with a dented head
- A green-glazed Japanese tea bowl, chipped on the rim
- A 1990s industrial CRT showing a black screen
- A length of climbing rope, used, faintly chalked

METAPHORS
Three completely different lenses on this board, each one phrase:
- If this board were a sound: …
- If this board were a creature/entity: …
- If this board were a place: …
Pick unexpected pairings. Avoid the obvious.

SEARCH HOOKS — concrete handles for finding more references
The user can't generate images; they need search terms to dig further.
Be specific. "Neighborhoods, not countries. Decades, not 'vintage.'
Named individuals, not 'a photographer.'"
- Places: 3–4 specific locations (towns, neighborhoods, buildings,
  regions, scenes — e.g. "Naoshima boat sheds," "Kowloon Walled City,"
  "Marfa, TX," not "Japan" or "Asia").
- Eras / movements: 2–3 named cultural moments (e.g. "1970s Japanese
  Metabolism," "early-2000s blogspot dark academia," "post-Soviet
  Brutalism," not "vintage" or "modern").
- Creators: 2–3 specific photographers, designers, directors, or
  artists whose work hits the same nerve (e.g. "Hiroshi Sugimoto,"
  "Naoto Fukasawa," "Roni Horn," not "minimalist photographers").
- Queries: 2–3 search strings to try on Pinterest, Are.na, or Google
  Images. Make them specific enough to surface non-obvious results.

WHAT'S NOT HERE (but probably should be)
3 missing elements that would deepen or complete the world. Force
lateral thinking — pick things the board wouldn't think to include.
One short bullet each.

PROVOCATIONS — 5 questions for the user
Open questions to push thinking outward, not yes/no questions.
Examples (don't copy these — generate new ones for this board):
- What's the smallest object that captures this whole vibe?
- What's the luxury version vs. the poverty version of this aesthetic?
- What sound enters the room when this material is touched?
- What would 100 years of weathering do to this?
- What would offend this board?

ADJACENT WORLDS — 3 directions to explore next
Each as one short phrase + a one-line "why this opens new ground."
Pick worlds that share an underlying principle but look completely
different from this one. Avoid variations of the same vibe.
`.trim();

export function register(server: McpServer): void {
  server.prompt(
    "unpack",
    "Abstract a Pinterest board into essence, tensions, a concept diagram, metaphors, missing elements, and brainstorm provocations. Designed for ideation, not summary.",
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
          "Optional use-case slant — e.g. 'product packaging', 'editorial photoshoot', 'café interior'. Bends provocations and adjacent worlds toward this.",
        ),
    },
    ({ board, focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Unpack Pinterest board "${board}" as an abstraction for brainstorming.`,
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
