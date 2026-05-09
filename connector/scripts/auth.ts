/**
 * One-shot OAuth flow for Pinterest API v5.
 *
 * Spins up a local Express server on :3000, opens the browser to Pinterest's
 * consent page, handles the redirect, exchanges the code for tokens, writes
 * them to .env, and exits.
 *
 * Usage: `npm run auth`
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import open from "open";

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = ["boards:read", "pins:read"];
const AUTH_URL = "https://www.pinterest.com/oauth/";
const TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(
      `Missing ${name}. Copy .env.example to .env and fill in your Pinterest app credentials.`,
    );
    process.exit(1);
  }
  return v;
}

async function exchangeCode(
  clientId: string,
  clientSecret: string,
  code: string,
): Promise<TokenResponse> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Merge new key=value pairs into an existing .env file, preserving comments
 * and ordering. Keys not present are appended.
 */
async function writeEnv(updates: Record<string, string>): Promise<void> {
  let existing = "";
  try {
    existing = await fs.readFile(ENV_PATH, "utf8");
  } catch {
    // .env doesn't exist yet — start from .env.example if available.
    try {
      existing = await fs.readFile(path.join(ROOT, ".env.example"), "utf8");
    } catch {
      existing = "";
    }
  }

  const lines = existing.split("\n");
  const seen = new Set<string>();
  const out = lines.map((line) => {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (!m) return line;
    const key = m[1];
    if (key in updates) {
      seen.add(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });
  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) out.push(`${key}=${value}`);
  }
  await fs.writeFile(ENV_PATH, out.join("\n"), "utf8");
}

async function main(): Promise<void> {
  const clientId = requireEnv("PINTEREST_CLIENT_ID");
  const clientSecret = requireEnv("PINTEREST_CLIENT_SECRET");

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(","));
  authUrl.searchParams.set("state", state);

  const app = express();

  const tokenPromise = new Promise<TokenResponse>((resolve, reject) => {
    app.get("/callback", async (req, res) => {
      const { code, state: returnedState, error, error_description } = req.query;
      if (error) {
        res.status(400).send(`Pinterest returned an error: ${error} ${error_description ?? ""}`);
        reject(new Error(`Pinterest error: ${error} ${error_description ?? ""}`));
        return;
      }
      if (typeof code !== "string" || returnedState !== state) {
        res.status(400).send("Invalid callback (missing code or state mismatch).");
        reject(new Error("Invalid callback"));
        return;
      }
      try {
        const tokens = await exchangeCode(clientId, clientSecret, code);
        res.send(
          `<html><body style="font-family:system-ui;padding:2rem;">
            <h2>Pinterest connected ✓</h2>
            <p>You can close this tab and return to your terminal.</p>
          </body></html>`,
        );
        resolve(tokens);
      } catch (e) {
        res.status(500).send(`Token exchange failed: ${(e as Error).message}`);
        reject(e);
      }
    });
  });

  const server = app.listen(PORT, () => {
    console.log(`Listening on ${REDIRECT_URI}`);
    console.log(`Opening browser for Pinterest consent…`);
    void open(authUrl.toString());
  });

  try {
    const tokens = await tokenPromise;
    const expiresAt = Date.now() + tokens.expires_in * 1000;
    await writeEnv({
      PINTEREST_ACCESS_TOKEN: tokens.access_token,
      PINTEREST_REFRESH_TOKEN: tokens.refresh_token,
      PINTEREST_TOKEN_EXPIRES_AT: String(expiresAt),
    });
    console.log(`Saved tokens to ${ENV_PATH}`);
    console.log(`Scope: ${tokens.scope}`);
    console.log(`Access token expires in ${tokens.expires_in}s`);
  } finally {
    server.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
