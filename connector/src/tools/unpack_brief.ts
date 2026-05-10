/**
 * The "unpack" tool. Bundles the structured brief instructions WITH the
 * Pinterest data into a single tool result, so Claude sees both at once
 * and produces the structured output reliably.
 *
 * Why this exists as a tool (not an MCP prompt): Claude Desktop's chat
 * UI doesn't surface MCP prompts in the `/` dropdown. Tools are the
 * only first-class extension point that actually gets invoked when the
 * user says natural-language phrases like "unpack ontrep_ref".
 *
 * The tool description below is what makes Claude pick it up — it
 * lists trigger phrases the user is likely to say. The first content
 * block of the tool result is the synthesis brief itself, which Claude
 * follows when generating the response.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchImage, mimeFromUrl } from "../images.js";
import type { PinterestClient } from "../pinterest.js";

const SYNTHESIS_BRIEF = `
You are unpacking a Pinterest mood board into a structured brainstorming
brief. Your job is NOT to describe what's on the board — extract what
it's *secretly about* and surface productive tensions, lateral metaphors,
and concrete handles for finding more references.

Return ONLY the structured output below. NO preamble. NO "let me check"
or "I don't have it in front of me." NO closing question (the user can
ask follow-ups). Start at "ESSENCE."

Be specific. Borrow vocabulary from the pins where it fits. Banned
words (corporate-deck filler — find the specific word for what you
actually see): "modern," "elevated," "premium," "curated," "iconic,"
"timeless," "luxurious," "sophisticated," "minimalist."

If a focus is provided in the request, bend OBJECTS, PROVOCATIONS, and
ADJACENT WORLDS toward that use case.

## Output format — use these exact section headers, in this order

ESSENCE
One sentence. The irreducible idea. Format: "X meets Y in Z" or
"a study in <tension>." This is what the board is *secretly* about,
not what it depicts.

TENSIONS
2–3 productive contradictions. One per line:
  <thing A>  ⇄  <thing B>
    one short line on what the contradiction is doing

CONCEPT DIAGRAM
A small ASCII diagram (5–10 lines) showing the structural relationship.
Use spectrums, arrows, boxes, 2×2 grids — whatever fits. Examples:

  RIGID  ─────×─────  FLOWING

  or:

  [ chrome ] ──reflects──▶ [ world ]
        ▲                       │
        └── corrodes into ◀─────┘

WORLD
2–3 sentences. Where are we? Time of day, season, scale? What just
happened or is about to happen? Open like a short story, not a brand
statement.

MOOD ADJECTIVES
5–8 adjectives separated by " · ". Mix expected with surprising.

HASHTAGS
5–8 lowercase hashtags space-separated. Include 1–2 named aesthetic
movements (#wabisabi, #brutalism, #y2k, #solarpunk, etc.) and the
rest specific to this board.

PALETTE — <evocative 2–3 word name>
4–6 swatches estimated from the thumbnails. Format:
\`<color name> #HEX\` · \`<color name> #HEX\` · …
The palette name is a phrase that names the feeling ("Burnt Mirror"),
not a description ("Cool Greys").

TYPOGRAPHY
- Family: 2 named typefaces (heading + body), specific actual faces
  (e.g. "GT America Mono / Söhne Buch"), not categories.
- Tone: 2–3 adjectives describing the type's voice.
- Avoid: one type direction that would break the world.

MATERIALS
4–6 specific textures or surfaces, separated by " · ". Touchable and
namable. No "textured" or "matte." Pick the kind of material a
fabricator could quote you a price for.

OBJECTS
3–5 specific artifacts that belong in this world. Choose objects that
*embody* the essence rather than illustrate it. Surprising over
obvious. Format: noun + qualifier, one per bullet.

SONIC PALETTE
3–5 specific sound elements as a bulleted list. Concrete (instrument,
source, environmental sound — not "calming music"). End with a line
"References:" naming 2–3 artists, albums, or recording types.

METAPHORS
- If this board were a sound: …
- If this board were a creature/entity: …
- If this board were a place: …
Pick unexpected pairings.

SEARCH HOOKS
Concrete handles for finding more references. Be specific.
"Neighborhoods, not countries. Decades, not 'vintage.' Named
individuals, not 'a photographer.'"
- Places: 3–4 specific (e.g. "Naoshima boat sheds," "Marfa, TX").
- Eras / movements: 2–3 named (e.g. "1970s Japanese Metabolism").
- Creators: 2–3 named photographers/designers/directors/artists.
- Queries: 2–3 search strings tuned for non-obvious results on
  Pinterest, Are.na, or Google Images.

WHAT'S NOT HERE (but probably should be)
3 missing elements that would deepen the world. Lateral thinking.

PROVOCATIONS
5 open brainstorm questions (not yes/no). Push thinking outward.

ADJACENT WORLDS
3 lateral directions, each as one short phrase + a one-line "why."
Pick worlds that share an underlying principle but look completely
different.
`.trim();

const TRIGGER_DESCRIPTION = [
  "Unpack a Pinterest board into a structured brainstorming brief —",
  "essence, tensions, ASCII concept diagram, world, mood adjectives,",
  "hashtags, named palette, typography, materials, objects, sonic palette,",
  "metaphors, search hooks (places/eras/creators), missing elements, and",
  "provocations.",
  "",
  "USE THIS TOOL whenever the user asks to: unpack a board, abstract a",
  "board, get the vibe of a board, find themes in a board, brainstorm",
  "from a board, or types '/unpack <board>'. Don't just describe the",
  "board — call this tool to get the proper structured output.",
  "",
  "The tool result will include the structured-output instructions plus",
  "the board's metadata, pin titles/descriptions, and thumbnail images.",
  "Follow the instructions in the first text block exactly.",
].join(" ");

function looksLikeBoardId(s: string): boolean {
  return /^\d{15,}$/.test(s.trim());
}

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "unpack_brief",
    TRIGGER_DESCRIPTION,
    {
      board: z
        .string()
        .describe(
          "Pinterest board name or numeric ID. If a name is given, the closest match is resolved automatically.",
        ),
      focus: z
        .string()
        .optional()
        .describe(
          "Optional use-case slant — e.g. 'product packaging', 'editorial photoshoot', 'café interior'.",
        ),
    },
    async ({ board, focus }) => {
      // 1. Resolve board name → ID
      let boardId: string;
      let resolvedName = board;
      if (looksLikeBoardId(board)) {
        boardId = board;
      } else {
        const all = await client.listBoards();
        const target = board.toLowerCase().trim();
        const match =
          all.find((b) => b.name.toLowerCase() === target) ??
          all.find((b) => b.name.toLowerCase().includes(target)) ??
          all.find((b) => target.includes(b.name.toLowerCase()));
        if (!match) {
          return {
            content: [
              {
                type: "text",
                text: `No board matching "${board}". Available boards: ${all
                  .map((b) => b.name)
                  .join(", ")}`,
              },
            ],
            isError: true,
          };
        }
        boardId = match.id;
        resolvedName = match.name;
      }

      // 2. Fetch board metadata + pins in parallel
      const [boardMeta, allPins] = await Promise.all([
        client.getBoard(boardId),
        client.getBoardPins(boardId),
      ]);
      const pins = allPins.slice(0, 8);

      // 3. Fetch thumbnails (best-effort, skip failures)
      const thumbs = await Promise.all(
        pins.map(async (pin) => {
          const src = pin.thumbnail ?? pin.image;
          if (!src) return null;
          try {
            const bytes = await fetchImage(src.url);
            return {
              id: pin.id,
              title: pin.title,
              data: bytes.toString("base64"),
              mimeType: mimeFromUrl(src.url),
            };
          } catch {
            return null;
          }
        }),
      );

      // 4. Build the response: brief first, then context, then images
      const pinSummaries = pins
        .map((p, i) => {
          const t = p.title ?? "(untitled)";
          const d = p.description?.trim();
          return d
            ? `${i + 1}. ${t} — ${d}`
            : `${i + 1}. ${t}`;
        })
        .join("\n");

      const contextBlock = [
        `BOARD: "${resolvedName}" (${boardMeta.pin_count} pins total, showing ${pins.length})`,
        focus ? `FOCUS: ${focus}` : "",
        "",
        "PIN TITLES & DESCRIPTIONS:",
        pinSummaries,
      ]
        .filter(Boolean)
        .join("\n");

      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
      > = [
        { type: "text", text: SYNTHESIS_BRIEF },
        { type: "text", text: contextBlock },
      ];

      for (const t of thumbs) {
        if (!t) continue;
        content.push({ type: "image", data: t.data, mimeType: t.mimeType });
      }

      return { content };
    },
  );
}
