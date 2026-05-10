/**
 * Visual board browser. Returns every board with its cover thumbnail
 * as an MCP image block, so Claude can show the user a grid of their
 * Pinterest boards instead of just listing names.
 *
 * Triggered when the user wants to *see* their boards — phrases like
 * "show me my boards," "browse my Pinterest," "which board should I
 * unpack?" Claude can then visually pick the most interesting one.
 *
 * Pinterest's image_cover_url is ~400x300 — small enough that all 20+
 * boards fit comfortably under the 1MB tool-result cap.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchImage, mimeFromUrl } from "../images.js";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "browse_boards",
    "List every Pinterest board the user owns, with cover thumbnails as image blocks so Claude can visually browse them. Use when the user asks to *see* their boards (e.g. 'show me my Pinterest boards', 'browse my boards', 'which one should I unpack?'). For text-only metadata, use list_boards instead.",
    {},
    async () => {
      const boards = await client.listBoards();

      // Fetch all cover thumbnails in parallel. Failures are skipped —
      // some boards may not have a cover (empty boards) or the image may
      // 404; better to ship a partial grid than fail the whole call.
      const covers = await Promise.all(
        boards.map(async (b) => {
          if (!b.cover_url) return null;
          try {
            const bytes = await fetchImage(b.cover_url);
            return {
              id: b.id,
              data: bytes.toString("base64"),
              mimeType: mimeFromUrl(b.cover_url),
            };
          } catch {
            return null;
          }
        }),
      );

      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
      > = [
        {
          type: "text",
          text: `${boards.length} board${boards.length === 1 ? "" : "s"} on this Pinterest account. Cover thumbnails follow.`,
        },
      ];

      for (let i = 0; i < boards.length; i++) {
        const b = boards[i];
        const cover = covers[i];
        content.push({
          type: "text",
          text: `${b.name} — ${b.pin_count} pin${b.pin_count === 1 ? "" : "s"}${b.description ? ` · ${b.description}` : ""} (id: ${b.id})`,
        });
        if (cover) {
          content.push({ type: "image", data: cover.data, mimeType: cover.mimeType });
        }
      }

      return { content };
    },
  );
}
