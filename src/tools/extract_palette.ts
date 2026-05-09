import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  aggregateBoardPalette,
  extractPalette,
  fetchImage,
  nameColor,
  type PinPalette,
} from "../palette.js";
import type { PinterestClient } from "../pinterest.js";

export function register(server: McpServer, client: PinterestClient): void {
  server.tool(
    "extract_palette",
    "Extract dominant colors from each given pin plus an aggregate palette across all of them. Returns hex codes with relative weights.",
    {
      pin_ids: z.array(z.string()).min(1).max(50),
      colors_per_pin: z.number().int().min(1).max(10).default(5),
      aggregate_colors: z.number().int().min(1).max(16).default(8),
    },
    async ({ pin_ids, colors_per_pin, aggregate_colors }) => {
      const perPin: PinPalette[] = [];
      const errors: { pinId: string; error: string }[] = [];

      await Promise.all(
        pin_ids.map(async (id) => {
          try {
            const pin = await client.getPin(id);
            const src = pin.thumbnail ?? pin.image;
            if (!src) {
              errors.push({ pinId: id, error: "No image available" });
              return;
            }
            const bytes = await fetchImage(src.url);
            const swatches = await extractPalette(bytes, colors_per_pin);
            perPin.push({ pinId: id, swatches });
          } catch (e) {
            errors.push({ pinId: id, error: (e as Error).message });
          }
        }),
      );

      const aggregate = aggregateBoardPalette(perPin, aggregate_colors);
      const payload = {
        per_pin: perPin.map((p) => ({
          pin_id: p.pinId,
          swatches: p.swatches.map((s) => ({
            hex: s.hex,
            name: nameColor(s.rgb),
            weight: Number(s.weight.toFixed(3)),
          })),
        })),
        aggregate: aggregate.map((s) => ({
          hex: s.hex,
          name: nameColor(s.rgb),
          weight: Number(s.weight.toFixed(3)),
        })),
        errors,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      };
    },
  );
}
