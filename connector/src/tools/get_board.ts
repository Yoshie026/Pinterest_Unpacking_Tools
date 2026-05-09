import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "get_board",
    "Fetch board metadata along with every pin on the board (pagination is handled internally).",
    {
      board_id: z.string().describe("Pinterest board ID, as returned by list_boards."),
    },
    async ({ board_id }) => {
      const [board, pins] = await Promise.all([
        client.getBoard(board_id),
        client.getBoardPins(board_id),
      ]);
      const payload = {
        board: {
          id: board.id,
          name: board.name,
          description: board.description,
          pin_count: board.pin_count,
          follower_count: board.follower_count,
          privacy: board.privacy,
          created_at: board.created_at,
        },
        pins: pins.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          link: p.link,
          dominant_color: p.dominant_color,
          image_url: p.image?.url ?? null,
          thumbnail_url: p.thumbnail?.url ?? null,
          width: p.image?.width ?? null,
          height: p.image?.height ?? null,
        })),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );
}
