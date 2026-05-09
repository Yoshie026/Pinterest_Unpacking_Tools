/**
 * Thin Pinterest API v5 client.
 *
 * Handles pagination, token refresh on 401, and exposes typed shapes for
 * the subset of fields we surface to MCP tools.
 */
import fs from "node:fs/promises";
import path from "node:path";

const API_BASE = "https://api.pinterest.com/v5";
const TOKEN_URL = `${API_BASE}/oauth/token`;

export interface PinImage {
  url: string;
  width: number;
  height: number;
}

export interface Pin {
  id: string;
  title: string | null;
  description: string | null;
  link: string | null;
  board_id: string;
  /** Best-available image (originals if present, otherwise largest). */
  image: PinImage | null;
  /** Smaller image suitable for thumbnails (~236px). */
  thumbnail: PinImage | null;
  dominant_color: string | null;
  created_at: string | null;
}

export interface Board {
  id: string;
  name: string;
  description: string | null;
  pin_count: number;
  follower_count: number;
  privacy: string;
  created_at: string | null;
}

interface RawPinMedia {
  images?: Record<string, { url: string; width: number; height: number }>;
}

interface RawPin {
  id: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  board_id: string;
  media?: RawPinMedia;
  dominant_color?: string | null;
  created_at?: string | null;
}

interface PageEnvelope<T> {
  items: T[];
  bookmark?: string | null;
}

export interface PinterestCredentials {
  /** Required. */
  accessToken: string;
  /** Optional — only needed for auto-refresh on 401. */
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  expiresAt?: number;
}

export class PinterestClient {
  private creds: PinterestCredentials;
  private envPath: string;
  private refreshing: Promise<void> | null = null;

  constructor(creds: PinterestCredentials, envPath: string) {
    this.creds = creds;
    this.envPath = envPath;
  }

  static fromEnv(envPath: string): PinterestClient {
    if (!process.env.PINTEREST_ACCESS_TOKEN) {
      throw new Error(
        "PINTEREST_ACCESS_TOKEN is not set. Run `npm run auth` to complete the OAuth flow.",
      );
    }
    const expiresAt = Number(process.env.PINTEREST_TOKEN_EXPIRES_AT ?? "0");
    return new PinterestClient(
      {
        accessToken: process.env.PINTEREST_ACCESS_TOKEN,
        clientId: process.env.PINTEREST_CLIENT_ID,
        clientSecret: process.env.PINTEREST_CLIENT_SECRET,
        refreshToken: process.env.PINTEREST_REFRESH_TOKEN,
        expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
      },
      envPath,
    );
  }

  private canRefresh(): boolean {
    return Boolean(
      this.creds.clientId && this.creds.clientSecret && this.creds.refreshToken,
    );
  }

  private async refresh(): Promise<void> {
    if (!this.canRefresh()) {
      throw new Error(
        "Pinterest access token is invalid or expired, and no refresh credentials are configured. Run `npm run auth` and update the access token in the connector settings.",
      );
    }
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const basic = Buffer.from(
        `${this.creds.clientId}:${this.creds.clientSecret}`,
      ).toString("base64");
      const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.creds.refreshToken!,
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
        throw new Error(`Refresh failed (${res.status}): ${text}`);
      }
      const data = (await res.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      };
      this.creds.accessToken = data.access_token;
      if (data.refresh_token) this.creds.refreshToken = data.refresh_token;
      this.creds.expiresAt = Date.now() + data.expires_in * 1000;
      await this.persistTokens();
    })();
    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  private async persistTokens(): Promise<void> {
    let existing = "";
    try {
      existing = await fs.readFile(this.envPath, "utf8");
    } catch {
      return; // No .env to update — running with env vars only.
    }
    const updates: Record<string, string> = {
      PINTEREST_ACCESS_TOKEN: this.creds.accessToken,
      PINTEREST_TOKEN_EXPIRES_AT: String(this.creds.expiresAt ?? 0),
    };
    if (this.creds.refreshToken) {
      updates.PINTEREST_REFRESH_TOKEN = this.creds.refreshToken;
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
    await fs.writeFile(this.envPath, out.join("\n"), "utf8");
  }

  private async request<T>(pathAndQuery: string): Promise<T> {
    // Proactively refresh if we know the token is past its TTL — only if
    // we have refresh credentials available; otherwise just try the request
    // and let the user re-auth on failure.
    if (
      this.canRefresh() &&
      this.creds.expiresAt &&
      Date.now() > this.creds.expiresAt - 60_000
    ) {
      await this.refresh();
    }
    const url = `${API_BASE}${pathAndQuery}`;
    const doFetch = async () =>
      fetch(url, {
        headers: { Authorization: `Bearer ${this.creds.accessToken}` },
      });

    let res = await doFetch();
    if (res.status === 401 && this.canRefresh()) {
      await this.refresh();
      res = await doFetch();
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pinterest API ${res.status} on ${pathAndQuery}: ${text}`);
    }
    return (await res.json()) as T;
  }

  private async *paginate<T>(pathOnly: string, query: URLSearchParams): AsyncGenerator<T> {
    let bookmark: string | null | undefined;
    do {
      const q = new URLSearchParams(query);
      if (bookmark) q.set("bookmark", bookmark);
      const page = await this.request<PageEnvelope<T>>(`${pathOnly}?${q.toString()}`);
      for (const item of page.items) yield item;
      bookmark = page.bookmark;
    } while (bookmark);
  }

  async listBoards(): Promise<Board[]> {
    const out: Board[] = [];
    const q = new URLSearchParams({ page_size: "100" });
    for await (const b of this.paginate<Board>("/boards", q)) {
      out.push(b);
    }
    return out;
  }

  async getBoard(boardId: string): Promise<Board> {
    return this.request<Board>(`/boards/${encodeURIComponent(boardId)}`);
  }

  async getBoardPins(boardId: string): Promise<Pin[]> {
    const out: Pin[] = [];
    const q = new URLSearchParams({ page_size: "100" });
    for await (const raw of this.paginate<RawPin>(
      `/boards/${encodeURIComponent(boardId)}/pins`,
      q,
    )) {
      out.push(normalizePin(raw));
    }
    return out;
  }

  async getPin(pinId: string): Promise<Pin> {
    const raw = await this.request<RawPin>(`/pins/${encodeURIComponent(pinId)}`);
    return normalizePin(raw);
  }
}

function pickImage(
  media: RawPinMedia | undefined,
  preferred: string[],
): PinImage | null {
  const images = media?.images;
  if (!images) return null;
  for (const key of preferred) {
    const img = images[key];
    if (img) return { url: img.url, width: img.width, height: img.height };
  }
  // Fall back to the largest by area.
  let best: PinImage | null = null;
  for (const img of Object.values(images)) {
    const area = img.width * img.height;
    if (!best || area > best.width * best.height) {
      best = { url: img.url, width: img.width, height: img.height };
    }
  }
  return best;
}

function normalizePin(raw: RawPin): Pin {
  return {
    id: raw.id,
    title: raw.title ?? null,
    description: raw.description ?? null,
    link: raw.link ?? null,
    board_id: raw.board_id,
    // Pick sizes that are already Claude-friendly (no need to resize locally).
    // ~1024px max edge fits comfortably in vision input limits.
    image: pickImage(raw.media, ["1200x", "736x", "600x", "originals"]),
    thumbnail: pickImage(raw.media, ["600x", "474x", "236x"]),
    dominant_color: raw.dominant_color ?? null,
    created_at: raw.created_at ?? null,
  };
}

export function defaultEnvPath(): string {
  return path.resolve(process.cwd(), ".env");
}
