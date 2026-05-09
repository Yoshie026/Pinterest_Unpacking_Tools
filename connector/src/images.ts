/**
 * Tiny image-fetch helpers. Replaces the parts of the old palette.ts
 * that other tools depended on, minus the sharp-based extraction.
 *
 * No native dependencies — just fetch + a URL extension sniff.
 */
export async function fetchImage(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`Image fetch failed (${res.status}) for ${url}`);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

export function mimeFromUrl(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
