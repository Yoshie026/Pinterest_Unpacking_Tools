/**
 * Slash-command prompt: quick view of a Pinterest board — metadata,
 * pin count, and a thumbnail grid Claude can see. Lighter-weight than
 * /unpack; useful for "show me what's on this board" without forcing
 * the synthesis step.
 *
 * Invocation in Claude:
 *   /board board:"metal_material_inspo"
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BRIEF = `
Show the user a quick visual + textual summary of the named Pinterest
board.

# Step 1 — Resolve

If \`board\` looks like a numeric ID, use it. Otherwise, call
\`list_boards\` and find the closest name match. Ask if ambiguous.

# Step 2 — Fetch

Call \`board_brief\` with \`max_pins: 8, include_thumbnails: true\`.

# Step 3 — Respond

Return:
- One line: \`<board name> — <pin_count> pins\`
- One paragraph (2–3 sentences) describing what the board is about,
  inferred from the thumbnails and any pin titles/descriptions.
- The thumbnail images as-is (Claude will render them inline).

Don't go full mood-brief. The user can run \`/unpack\` if they want that.
`.trim();

export function register(server: McpServer): void {
  server.prompt(
    "board",
    "Quick view of a Pinterest board — metadata, a one-paragraph description, and a thumbnail grid.",
    {
      board: z
        .string()
        .describe("Pinterest board name or ID."),
    },
    ({ board }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Show me Pinterest board "${board}".\n\n${BRIEF}`,
          },
        },
      ],
    }),
  );
}
