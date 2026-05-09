import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import { z } from "zod";
import {
  aggregateBoardPalette,
  extractPalette,
  fetchImage,
  nameColor,
  type PinPalette,
} from "../palette.js";
import type { PinterestClient } from "../pinterest.js";

const THUMB_EDGE = 512;

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "board_brief",
    "One-shot theme analysis bundle for a board: metadata + aggregate palette + per-pin palettes + a grid of pin thumbnails as image content blocks. Designed so a single tool call gives Claude everything it needs to describe a board's visual theme.",
    {
      board_id: z.string(),
      max_pins: z
        .number()
        .int()
        .min(1)
        .max(40)
        .default(12)
        .describe("Maximum pins to include thumbnails + palette for."),
      include_thumbnails: z.boolean().default(true),
    },
    async ({ board_id, max_pins, include_thumbnails }) => {
      const [board, allPins] = await Promise.all([
        client.getBoard(board_id),
        client.getBoardPins(board_id),
      ]);
      const pins = allPins.slice(0, max_pins);

      const perPin: PinPalette[] = [];
      const thumbs: { pinId: string; data: string; mimeType: string; title: string | null }[] = [];

      await Promise.all(
        pins.map(async (pin) => {
          const src = pin.thumbnail ?? pin.image;
          if (!src) return;
          try {
            const bytes = await fetchImage(src.url);
            const [swatches, processed] = await Promise.all([
              extractPalette(bytes, 5),
              include_thumbnails
                ? sharp(bytes)
                    .resize(THUMB_EDGE, THUMB_EDGE, {
                      fit: "inside",
                      withoutEnlargement: true,
                    })
                    .jpeg({ quality: 80 })
                    .toBuffer()
                : Promise.resolve(null),
            ]);
            perPin.push({ pinId: pin.id, swatches });
            if (processed) {
              thumbs.push({
                pinId: pin.id,
                data: processed.toString("base64"),
                mimeType: "image/jpeg",
                title: pin.title,
              });
            }
          } catch {
            // Skip pins that fail to fetch — better to return a partial brief than nothing.
          }
        }),
      );

      const aggregate = aggregateBoardPalette(perPin, 8);

      // A flat corpus of pin titles + descriptions. Pinterest captions are
      // often the strongest "what world is this" signal, so we surface them
      // separately from the per-pin breakdown.
      const captions = pins
        .map((p) => [p.title, p.description].filter(Boolean).join(" — "))
        .filter((s) => s.length > 0);

      const summary = {
        board: {
          id: board.id,
          name: board.name,
          description: board.description,
          pin_count: board.pin_count,
          included_pins: pins.length,
        },
        captions_corpus: captions,
        aggregate_palette: aggregate.map((s) => ({
          hex: s.hex,
          name: nameColor(s.rgb),
          weight: Number(s.weight.toFixed(3)),
        })),
        per_pin: perPin.map((p) => {
          const pin = pins.find((x) => x.id === p.pinId);
          return {
            pin_id: p.pinId,
            title: pin?.title ?? null,
            description: pin?.description ?? null,
            link: pin?.link ?? null,
            swatches: p.swatches.map((s) => ({
              hex: s.hex,
              name: nameColor(s.rgb),
              weight: Number(s.weight.toFixed(3)),
            })),
          };
        }),
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
