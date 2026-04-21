import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { AssetSeries, CpiSeries, PricePoint, Timeframe } from "./types";
import { filterByTimeframe } from "./timeframe";
import { DERIVED, isDerived } from "./derived";

// Max points in the sparkline fallback. Roughly matches what the
// AssetCard / HomeHero widths can actually render without aliasing.
const SPARKLINE_MAX = 200;

const DATA_DIR = join(process.cwd(), "public", "data");

// Raw file loader — only reads from disk, never dispatches to derived.
// Used internally by the derived-series compute functions so they can
// pull their inputs without risking infinite recursion.
async function loadRawAsset(
  symbol: string,
): Promise<{ points: PricePoint[] } | null> {
  try {
    const raw = await readFile(join(DATA_DIR, `${symbol}.json`), "utf8");
    const parsed = JSON.parse(raw) as AssetSeries;
    return { points: parsed.points };
  } catch {
    return null;
  }
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
  try {
    const raw = await readFile(join(DATA_DIR, `${symbol}.json`), "utf8");
    return JSON.parse(raw) as AssetSeries;
  } catch {
    return null;
  }
}

export async function loadCpi(): Promise<CpiSeries | null> {
  try {
    const raw = await readFile(join(DATA_DIR, "cpi-us.json"), "utf8");
    return JSON.parse(raw) as CpiSeries;
  } catch {
    return null;
  }
}

// Same shape as loadAsset but returns a sparkline-resolution series —
// filtered to the requested timeframe then subsampled to at most
// SPARKLINE_MAX points. Listing pages (Home Pulse, Markets grid) should
// prefer this: it keeps the RSC payload for the Markets page roughly an
// order of magnitude smaller without lying about timeframe-scoped
// statistics like percent change.
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
