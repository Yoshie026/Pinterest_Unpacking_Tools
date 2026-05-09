import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import { z } from "zod";
import { fetchImage } from "../palette.js";
import type { PinterestClient } from "../pinterest.js";

const MAX_EDGE = 1568; // Claude's recommended max long edge for vision input

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "get_pin_images",
    "Fetch image bytes for one or more pins and return them as image content blocks so Claude can see them. Images are resized to a max edge of 1568px and re-encoded as JPEG to stay within vision input limits.",
    {
      pin_ids: z
        .array(z.string())
        .min(1)
        .max(20)
        .describe("Pin IDs to fetch. Capped at 20 per call."),
      size: z
        .enum(["thumbnail", "full"])
        .default("full")
        .describe(
          "thumbnail (~236px) is faster and cheaper; full uses the highest-resolution image Pinterest exposes.",
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
            if (!source) return { ok: false, id, error: "No image available for pin" };
            const raw = await fetchImage(source.url);
            const processed = await sharp(raw)
              .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 85 })
              .toBuffer();
            return {
              ok: true,
              id,
              title: pin.title,
              data: processed.toString("base64"),
              mimeType: "image/jpeg",
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
