import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetSeries, CpiSeries, PricePoint, Timeframe } from "./types";
import { filterByTimeframe } from "./timeframe";
import { DERIVED, isDerived } from "./derived";

// Max points in the sparkline fallback. Roughly matches what the
// AssetCard / HomeHero widths can actually render without aliasing.
const SPARKLINE_MAX = 200;

const DATA_DIR = join(process.cwd(), "public", "data");

// Read a JSON file from public/data. On Cloudflare Workers there is no
// filesystem, so dynamic requests (Home with searchParams, Markets) fall
// through to the ASSETS service binding which serves the same files
// in-process without a real network hop. Build-time prerender runs on
// Node and uses readFile directly.
async function readDataFile(filename: string): Promise<string | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const assets = ctx.env.ASSETS;
    if (assets) {
      const res = await assets.fetch(
        new URL(`https://assets.local/data/${filename}`),
      );
      if (res.ok) return await res.text();
      return null;
    }
  } catch {
    // Not running on Cloudflare — fall through to Node fs.
  }
  try {
    return await readFile(join(DATA_DIR, filename), "utf8");
  } catch {
    return null;
  }
}

// Raw file loader — only reads from disk, never dispatches to derived.
// Used internally by the derived-series compute functions so they can
// pull their inputs without risking infinite recursion.
async function loadRawAsset(
  symbol: string,
): Promise<{ points: PricePoint[] } | null> {
  const raw = await readDataFile(`${symbol}.json`);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as AssetSeries;
  return { points: parsed.points };
}

export async function loadAsset(symbol: string): Promise<AssetSeries | null> {
  if (isDerived(symbol)) {
    const cpi = await loadCpi();
    const points = await DERIVED[symbol]({ load: loadRawAsset, cpi });
    if (points.length === 0) return null;
    return {
      symbol,
      name: symbol,
      currency: "",
      source: "derived",
      fetchedAt: new Date().toISOString(),
      points,
    };
  }
  const raw = await readDataFile(`${symbol}.json`);
  if (!raw) return null;
  return JSON.parse(raw) as AssetSeries;
}

export async function loadCpi(): Promise<CpiSeries | null> {
  const raw = await readDataFile("cpi-us.json");
  if (!raw) return null;
  return JSON.parse(raw) as CpiSeries;
}

// Same shape as loadAsset but returns a sparkline-resolution series —
// filtered to the requested timeframe then subsampled to at most
// SPARKLINE_MAX points.
//
// Why per-timeframe: a single "ALL-history thinned to 200" dataset would
// collapse the last year down to ~3 points on our 60-year daily series.
// Any 1Y-scoped stat computed from it would be wildly imprecise. Filter
// first, thin second — the visual sparkline stays smooth and the number
// next to it stays honest.
export async function loadAssetSparkline(
  symbol: string,
  timeframe: Timeframe = "ALL",
): Promise<AssetSeries | null> {
  const full = await loadAsset(symbol);
  if (!full) return null;
  const filtered = filterByTimeframe(full.points, timeframe);
  return { ...full, points: thin(filtered, SPARKLINE_MAX) };
}

// Batch sparkline loader for listing pages (Home Pulse, Markets grid).
// Reads a single prebuilt bundle per timeframe (produced by
// scripts/build-pulse.mjs) instead of fanning out to 31 individual
// readDataFile calls and re-filtering at request time. Keeps the Worker
// under the 50ms CPU ceiling on the free plan.
export type PulseBundle = Record<string, { points: PricePoint[] }>;

export async function loadPulse(
  timeframe: Timeframe,
): Promise<PulseBundle | null> {
  const raw = await readDataFile(`pulse/${timeframe}.json`);
  if (!raw) return null;
  return JSON.parse(raw) as PulseBundle;
}

function thin(points: PricePoint[], max: number): PricePoint[] {
  if (points.length <= max) return points.slice();
  const step = (points.length - 1) / (max - 1);
  const out = new Array<PricePoint>(max);
  for (let i = 0; i < max - 1; i++) {
    out[i] = points[Math.floor(i * step)];
  }
  out[max - 1] = points[points.length - 1];
  return out;
}
