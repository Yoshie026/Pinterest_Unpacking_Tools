import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchImage, mimeFromUrl } from "../images.js";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "get_pin_images",
    "Fetch images for given pin IDs and return them as image content blocks so Claude can see them. Pinterest's pre-sized URLs are used directly — no local resizing.",
    {
      pin_ids: z.array(z.string()).min(1).max(20),
      size: z
        .enum(["thumbnail", "full"])
        .default("full")
        .describe(
          "thumbnail (~600px) is faster; full (~1200px) is better for color/detail.",
        ),
    },
    async ({ pin_ids, size }) => {
      type FetchResult =
        | { ok: true; id: string; title: string | null; data: string; mimeType: string }
        | { ok: false; id: string; error: string };

      const results: FetchResult[] = await Promise.all(
        pin_ids.map(async (id): Promise<FetchResult> => {
          try {
            const pin = await client.getPin(id);
            const source = size === "thumbnail" ? pin.thumbnail ?? pin.image : pin.image;
            if (!source) return { ok: false, id, error: "No image available" };
            const bytes = await fetchImage(source.url);
            return {
              ok: true,
              id,
              title: pin.title,
              data: bytes.toString("base64"),
              mimeType: mimeFromUrl(source.url),
            };
          } catch (e) {
            return { ok: false, id, error: (e as Error).message };
          }
        }),
      );

      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; data: string; mimeType: string }
      > = [];

      for (const r of results) {
        if (!r.ok) {
          content.push({ type: "text", text: `Pin ${r.id}: ${r.error}` });
          continue;
        }
        content.push({
          type: "text",
          text: `Pin ${r.id}${r.title ? ` — ${r.title}` : ""}`,
        });
        content.push({ type: "image", data: r.data, mimeType: r.mimeType });
      }
      return { content };
    },
  );
}
