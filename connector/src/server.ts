#!/usr/bin/env node
/**
 * MCP entry point. Exposes Pinterest tools over stdio so the server can be
 * launched directly by Claude Desktop (or any MCP client).
 */
const log = (msg: string) => console.error(`[pinterest-mcp] ${msg}`);
log(`booting node=${process.version} cwd=${process.cwd()}`);
log(`token=${process.env.PINTEREST_ACCESS_TOKEN ? "set" : "MISSING"}`);

process.on("uncaughtException", (e) => {
  log(`UNCAUGHT: ${e?.stack ?? e}`);
  process.exit(1);
});
process.on("unhandledRejection", (e) => {
  log(`UNHANDLED REJECTION: ${e}`);
  process.exit(1);
});

import "dotenv/config";
log("dotenv loaded");
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
log("mcp sdk loaded");
import { PinterestClient } from "./pinterest.js";
import { register as registerListBoards } from "./tools/list_boards.js";
import { register as registerBrowseBoards } from "./tools/browse_boards.js";
import { register as registerGetBoard } from "./tools/get_board.js";
import { register as registerGetPinImages } from "./tools/get_pin_images.js";
import { register as registerBoardBrief } from "./tools/board_brief.js";
import { register as registerUnpackBrief } from "./tools/unpack_brief.js";
import { register as registerUnpackPrompt } from "./prompts/unpack.js";
import { register as registerBoardPrompt } from "./prompts/board.js";
log("all modules loaded");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env lives at the project root, one level above dist/ or src/.
const ENV_PATH = path.resolve(__dirname, "..", ".env");

async function main(): Promise<void> {
  log("main() entered");
  const client = PinterestClient.fromEnv(ENV_PATH);
  log("PinterestClient ready");

  const server = new McpServer({
    name: "pinterest-mcp",
    version: "0.1.0",
  });
  log("McpServer instantiated");

  registerListBoards(server, client);
  registerBrowseBoards(server, client);
  registerGetBoard(server, client);
  registerGetPinImages(server, client);
  registerBoardBrief(server, client);
  registerUnpackBrief(server, client);
  registerUnpackPrompt(server);
  registerBoardPrompt(server);
  log("tools and prompts registered");

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("connected to stdio transport, ready");
}

main().catch((err) => {
  // stderr is fine for MCP — stdio transport uses stdout only.
  console.error("[pinterest-mcp] fatal:", err);
  process.exit(1);
});
