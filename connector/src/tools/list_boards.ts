import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "list_boards",
    "List all boards owned by the authenticated Pinterest user.",
    {},
    async () => {
      const boards = await client.listBoards();
      const summary = boards.map((b) => ({
        id: b.id,
        name: b.name,
        pin_count: b.pin_count,
        privacy: b.privacy,
        description: b.description,
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ boards: summary, count: summary.length }, null, 2),
          },
        ],
      };
    },
  );
}
