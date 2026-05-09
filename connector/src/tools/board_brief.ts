import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchImage, mimeFromUrl } from "../images.js";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "board_brief",
    "One-shot bundle for theme analysis: board metadata + pin titles/descriptions + a thumbnail grid as image content blocks. Designed so a single tool call gives Claude everything it needs to describe a board's visual theme. Color analysis is delegated to Claude's visual reading of the thumbnails.",
    {
      board_id: z.string(),
      max_pins: z
        .number()
        .int()
        .min(1)
        .max(40)
        .default(12)
        .describe("How many pin thumbnails to include."),
      include_thumbnails: z.boolean().default(true),
    },
    async ({ board_id, max_pins, include_thumbnails }) => {
      const [board, allPins] = await Promise.all([
        client.getBoard(board_id),
        client.getBoardPins(board_id),
      ]);
      const pins = allPins.slice(0, max_pins);

      type Thumb = {
        pinId: string;
        title: string | null;
        data: string;
        mimeType: string;
      };
      const thumbs: Thumb[] = [];

      if (include_thumbnails) {
        await Promise.all(
          pins.map(async (pin) => {
            const src = pin.thumbnail ?? pin.image;
            if (!src) return;
            try {
              const bytes = await fetchImage(src.url);
              thumbs.push({
                pinId: pin.id,
                title: pin.title,
                data: bytes.toString("base64"),
                mimeType: mimeFromUrl(src.url),
              });
            } catch {
              // Skip pins that fail to fetch — partial brief is better than none.
            }
          }),
        );
      }

      const summary = {
        board: {
          id: board.id,
          name: board.name,
          description: board.description,
          pin_count: board.pin_count,
          included_pins: pins.length,
        },
        pins: pins.map((p) => ({
          pin_id: p.id,
          title: p.title,
          description: p.description,
          dominant_color: p.dominant_color,
          link: p.link,
        })),
      };

      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
      > = [{ type: "text", text: JSON.stringify(summary, null, 2) }];

      for (const t of thumbs) {
        content.push({
          type: "text",
          text: `Pin ${t.pinId}${t.title ? ` — ${t.title}` : ""}`,
        });
        content.push({ type: "image", data: t.data, mimeType: t.mimeType });
      }

      return { content };
    },
  );
}
