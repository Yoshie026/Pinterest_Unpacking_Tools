/**
 * Color extraction via sharp + bucket quantization.
 *
 * For each image we resize to a small thumbnail, sample raw RGB pixels,
 * quantize each channel into 4-bit buckets (so colors near each other
 * collapse), count frequencies, and return the top N as hex codes.
 *
 * The aggregate board palette is computed by summing per-pin bucket counts
 * across pins, weighted equally per pin (so a board with one busy pin
 * doesn't dominate). This gives a usable "what does this board feel like"
 * signal without pulling in heavier perceptual clustering.
 */
import sharp from "sharp";

export interface PaletteSwatch {
  hex: string;
  rgb: [number, number, number];
  /** Share of sampled pixels in [0, 1]. */
  weight: number;
}

export interface PinPalette {
  pinId: string;
  swatches: PaletteSwatch[];
}

const SAMPLE_SIZE = 100; // resize longest edge to this many px before sampling
const BUCKET_BITS = 4; // 4 bits/channel → 4096 buckets total
const BUCKET_MASK = 0xff << (8 - BUCKET_BITS);
const BUCKET_STEP = 1 << (8 - BUCKET_BITS); // 16

function quantizeChannel(v: number): number {
  return v & BUCKET_MASK;
}

function bucketKey(r: number, g: number, b: number): number {
  return (quantizeChannel(r) << 16) | (quantizeChannel(g) << 8) | quantizeChannel(b);
}

function bucketCenter(key: number): [number, number, number] {
  const r = ((key >> 16) & 0xff) + BUCKET_STEP / 2;
  const g = ((key >> 8) & 0xff) + BUCKET_STEP / 2;
  const b = (key & 0xff) + BUCKET_STEP / 2;
  return [Math.min(255, r) | 0, Math.min(255, g) | 0, Math.min(255, b) | 0];
}

function toHex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => c.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

/**
 * Return a short, evocative family name for an RGB color (e.g.
 * "muted terracotta", "deep teal", "pale bone"). Used as a linguistic
 * handle so Claude can reason about palettes without parsing hex codes.
 */
export function nameColor([r, g, b]: [number, number, number]): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  let h = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
        break;
      case gn:
        h = ((bn - rn) / d + 2) * 60;
        break;
      default:
        h = ((rn - gn) / d + 4) * 60;
    }
  }

  // Near-grayscale: classify purely by lightness.
  if (s < 0.08) {
    if (l < 0.08) return "near-black";
    if (l < 0.25) return "charcoal";
    if (l < 0.5) return "stone gray";
    if (l < 0.75) return "fog gray";
    if (l < 0.92) return "bone";
    return "off-white";
  }

  // Hue family.
  let family: string;
  if (h < 12 || h >= 348) family = "red";
  else if (h < 25) family = "rust";
  else if (h < 40) family = "terracotta";
  else if (h < 55) family = "amber";
  else if (h < 68) family = "yellow";
  else if (h < 90) family = "olive";
  else if (h < 150) family = "green";
  else if (h < 175) family = "teal";
  else if (h < 200) family = "cyan";
  else if (h < 235) family = "blue";
  else if (h < 270) family = "indigo";
  else if (h < 300) family = "violet";
  else if (h < 330) family = "magenta";
  else family = "pink";

  // Lightness modifier comes first when extreme.
  let lightness = "";
  if (l < 0.18) lightness = "deep";
  else if (l < 0.35) lightness = "dark";
  else if (l > 0.85) lightness = "pale";
  else if (l > 0.7) lightness = "light";

  // Saturation modifier — only when pulling away from pure color.
  let saturation = "";
  if (s < 0.25) saturation = "muted";
  else if (s < 0.45 && l > 0.4 && l < 0.75) saturation = "dusty";
  else if (s > 0.85) saturation = "vivid";

  // Special-case warm earth tones since they're so common in mood boards.
  if (family === "terracotta" && s < 0.5 && l > 0.4 && l < 0.7) return "warm sand";
  if (family === "amber" && s < 0.4 && l > 0.7) return "cream";
  if (family === "olive" && s < 0.35) return "sage";

  return [lightness, saturation, family].filter(Boolean).join(" ").trim();
}

/**
 * Extract the top-N dominant colors from an image buffer.
 * Returns hex codes sorted by frequency, descending.
 */
export async function extractPalette(
  imageBytes: Buffer,
  topN = 5,
): Promise<PaletteSwatch[]> {
  const { data, info } = await sharp(imageBytes)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: "inside", withoutEnlargement: true })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const counts = new Map<number, number>();
  let total = 0;
  const stride = info.channels;
  for (let i = 0; i < data.length; i += stride) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Skip near-pure white/black so backgrounds don't drown out the palette.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 12 || min > 244) continue;
    const key = bucketKey(r, g, b);
    counts.set(key, (counts.get(key) ?? 0) + 1);
    total++;
  }

  if (total === 0) return [];

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const merged = mergeNearbyBuckets(sorted);
  return merged.slice(0, topN).map(([key, count]) => {
    const rgb = bucketCenter(key);
    return { hex: toHex(rgb), rgb, weight: count / total };
  });
}

/**
 * Collapse buckets within a small RGB distance of an already-selected one
 * so we don't return five near-identical beiges.
 */
function mergeNearbyBuckets(sorted: [number, number][]): [number, number][] {
  const MIN_DIST_SQ = 30 * 30; // ~30 in each channel
  const out: [number, number][] = [];
  for (const [key, count] of sorted) {
    const [r, g, b] = bucketCenter(key);
    let merged = false;
    for (const item of out) {
      const [er, eg, eb] = bucketCenter(item[0]);
      const d = (r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2;
      if (d < MIN_DIST_SQ) {
        item[1] += count;
        merged = true;
        break;
      }
    }
    if (!merged) out.push([key, count]);
  }
  return out;
}

/**
 * Aggregate a board palette from per-pin palettes. Each pin contributes
 * equal weight regardless of how many swatches it has.
 */
export function aggregateBoardPalette(
  pinPalettes: PinPalette[],
  topN = 8,
): PaletteSwatch[] {
  if (pinPalettes.length === 0) return [];
  const buckets = new Map<number, { count: number; rgb: [number, number, number] }>();

  for (const { swatches } of pinPalettes) {
    if (swatches.length === 0) continue;
    const totalWeight = swatches.reduce((s, sw) => s + sw.weight, 0) || 1;
    for (const sw of swatches) {
      const key = bucketKey(sw.rgb[0], sw.rgb[1], sw.rgb[2]);
      const normalized = sw.weight / totalWeight; // each pin sums to 1
      const existing = buckets.get(key);
      if (existing) {
        existing.count += normalized;
      } else {
        buckets.set(key, { count: normalized, rgb: bucketCenter(key) });
      }
    }
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1].count - a[1].count);
  const collapsedInput: [number, number][] = sorted.map(([k, v]) => [k, v.count * 1000]);
  const merged = mergeNearbyBuckets(collapsedInput);
  const totalAfterMerge = merged.reduce((s, [, c]) => s + c, 0) || 1;
  return merged.slice(0, topN).map(([key, count]) => ({
    hex: toHex(bucketCenter(key)),
    rgb: bucketCenter(key),
    weight: count / totalAfterMerge,
  }));
}

/** Fetch image bytes with a sane timeout. */
export async function fetchImage(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`Image fetch failed (${res.status}) for ${url}`);
    }
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

/** Best-effort MIME inference from URL path. */
export function mimeFromUrl(url: string): string {
  const lower = url.toLowerCase().split("?")[0];
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}
