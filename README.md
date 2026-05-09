# pinterest-mcp

An MCP server that connects Pinterest to Claude for mood-board analysis.
Hand Claude a board ID and it can describe the visual theme, extract a
color palette, and reason about individual pins as images.

## What it gives Claude

| Tool | What it does |
| --- | --- |
| `list_boards` | All boards owned by the authenticated user. |
| `get_board` | Board metadata + every pin (pagination handled internally). |
| `get_pin_images` | Pin images returned as MCP image blocks so Claude can see them. |
| `extract_palette` | Dominant colors per pin + an aggregate palette across pins. |
| `board_brief` | One call: metadata + palette + thumbnails for theme analysis. |

## Quickstart

Requires Node 20+.

### 1. Create a Pinterest app

1. Visit <https://developers.pinterest.com/apps/> and create an app.
2. Add `http://localhost:3000/callback` to the app's redirect URIs.
3. Copy the **App ID** and **App secret key**.

### 2. Install

```bash
git clone <this-repo> pinterest-mcp
cd pinterest-mcp
npm install
cp .env.example .env
```

Open `.env` and paste your App ID into `PINTEREST_CLIENT_ID` and your
secret key into `PINTEREST_CLIENT_SECRET`. Leave the three token lines
blank — the next step fills them in.

### 3. Authorize

```bash
npm run auth
```

A browser tab opens, you click "Approve" on Pinterest, and the script
writes the access + refresh tokens back to `.env`. Scopes requested:
`boards:read`, `pins:read`.

The server auto-refreshes the access token when it expires and persists
the new one to `.env`. You only run `npm run auth` once.

### 4. Build

```bash
npm run build
```

### 5. Wire into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or the equivalent on Windows/Linux, and add an `mcpServers`
entry:

```json
{
  "mcpServers": {
    "pinterest": {
      "command": "node",
      "args": ["/absolute/path/to/pinterest-mcp/dist/server.js"]
    }
  }
}
```

If the file already has other keys (like `preferences`), keep them and
add `mcpServers` alongside. Restart Claude Desktop fully (Cmd-Q on macOS)
for it to pick up the change.

### Try it

Ask Claude:

> List my Pinterest boards, then run `board_brief` on the most
> interesting one and tell me what visual theme ties it together.

## Project layout

```
src/
  server.ts          # MCP entry (stdio transport)
  pinterest.ts       # API v5 client — pagination, token refresh
  palette.ts         # sharp-based color extraction
  tools/
    list_boards.ts
    get_board.ts
    get_pin_images.ts
    extract_palette.ts
    board_brief.ts
scripts/
  auth.ts            # one-shot OAuth flow on :3000
.env.example
```

## How it works

- **OAuth**: standard authorization-code flow against Pinterest API v5.
  `scripts/auth.ts` is a self-contained Express server that handles the
  redirect, exchanges the code, and writes tokens to `.env`. Refresh is
  handled inline by the client on 401 (or proactively when the token's
  TTL has passed).
- **Pagination**: Pinterest uses `bookmark` cursors. The client iterates
  internally so tools always return the full list.
- **Images for Claude**: `get_pin_images` and `board_brief` resize images
  to a 1568px max edge and re-encode as JPEG at q=85 before returning
  them as MCP image blocks. This stays inside Claude's vision input
  limits without forcing the user to think about it.
- **Palette extraction**: sharp resizes each image to a 100px sample,
  bucket-quantizes to 4 bits/channel, merges near-duplicate buckets, and
  ranks by frequency. The board-level aggregate weights each pin equally
  so one busy image can't dominate.

## Dev commands

```bash
npm run auth        # one-shot OAuth flow
npm run dev         # run server with tsx (no build needed)
npm run build       # compile to dist/
npm run typecheck   # tsc --noEmit
npm start           # run built dist/server.js
```

## Limitations

- This is a **local stdio MCP server** — it runs on your machine and
  reads from your `.env`. To share it with someone else, they'd need to
  go through the same setup (their own Pinterest app, their own OAuth
  flow). See [Public distribution](#public-distribution) below for paths
  to making it shareable.
- Read-only. The `pins:write` and `boards:write` scopes aren't
  requested — Claude can analyze your boards but not modify them.
- Pinterest's API rate limit is 1000 requests/hour per token. A
  `board_brief` on a 12-pin board uses ~14 API requests; image fetches
  hit Pinterest's CDN and don't count against that limit.

## Public distribution

This README's setup works for you locally but is too involved to ship to
non-technical users. Two realistic paths to making this a connector
other people can install:

### Desktop Extension (.dxt)

Bundle the server, dependencies, and a manifest into a single `.dxt`
file. Users download it and double-click inside Claude Desktop to
install. They still need to provide their own Pinterest app credentials
(Pinterest doesn't allow embedding secrets in distributables), but the
Node / build / config-edit steps go away. See
<https://www.anthropic.com/engineering/desktop-extensions>.

### Remote MCP connector

Rewrite the transport from stdio to streamable HTTP, host it (Cloudflare
Workers, fly.io, Vercel), and store per-user tokens in a DB. Get the
Pinterest app approved for production so a single app can serve any
user. End users then click "Connect Pinterest" inside Claude.ai — no
install, no config file, no per-user OAuth app. This is what mature
connectors (Linear, Asana, Google Drive) look like. The biggest cost is
Pinterest's production-app review, not the code.

## License

MIT.
