// Series that don't have their own data file but are computed on the fly
// from one or more primary series. Registered by symbol so the standard
// data loader can dispatch transparently — the rest of the app doesn't
// need to know a series is derived.
//
// Each compute function receives a Ctx with a raw loader (for other
// primary assets) and the CPI series (for inflation-related derivations).
// Return value is the same PricePoint[] shape as any primary series.

import type { PricePoint, CpiSeries } from "./types";
import { alignDaily, alignMonthly, cpiYoYSeries, ratioSeries } from "./align";

type Raw = { points: PricePoint[] } | null;

export type DerivedCtx = {
  load: (symbol: string) => Promise<Raw>;
  cpi: CpiSeries | null;
};

type Compute = (ctx: DerivedCtx) => Promise<PricePoint[]>;

function subtractDaily(a: PricePoint[], b: PricePoint[]): PricePoint[] {
  return alignDaily(a, b).map((r) => ({ t: r.t, c: r.a - r.b }));
}

// Last observation of each month — used to downsample a daily series before
// aligning with a monthly one (CPI). Beats taking the 1st day, which is
// often a weekend/holiday with a gap.
function monthEndSamples(daily: PricePoint[]): PricePoint[] {
  const byMonth = new Map<string, PricePoint>();
  for (const p of daily) byMonth.set(p.t.slice(0, 7), p);
  return Array.from(byMonth.values()).sort((a, b) =>
    a.t < b.t ? -1 : a.t > b.t ? 1 : 0,
  );
}

export const DERIVED: Record<string, Compute> = {
  // 10Y − 2Y Treasury yield spread. Classic yield-curve / recession
  // indicator — inverts (goes negative) before most US recessions.
  "spread-10-2": async ({ load }) => {
    const a = await load("us10y");
    const b = await load("us2y");
    if (!a || !b) return [];
    return subtractDaily(a.points, b.points);
  },

  // CPI year-over-year, i.e. headline US inflation. Monthly.
  "cpi-yoy": async ({ cpi }) => {
    if (!cpi) return [];
    return cpiYoYSeries(cpi);
  },

  // 10-year Treasury nominal yield minus CPI YoY — a proxy for the real
  // yield. Monthly granularity, since CPI is monthly.
  "real-yield-10y": async ({ load, cpi }) => {
    const y = await load("us10y");
    if (!y || !cpi) return [];
    const monthly = monthEndSamples(y.points);
    const yoy = cpiYoYSeries(cpi);
    return alignMonthly(monthly, yoy).map((r) => ({ t: r.t, c: r.a - r.b }));
  },

  // S&P 500 priced in ounces of gold. How many ounces of gold does one
  // S&P unit buy? Useful cross-check against dollar-denominated noise.
  "ratio-sp500-gold": async ({ load }) => {
    const s = await load("sp500");
    const g = await load("gold");
    if (!s || !g) return [];
    return ratioSeries(s.points, g.points);
  },

  // Gold priced in barrels of WTI oil. When this ratio rises, gold is
  // getting more valuable vs. energy (flight-to-safety or oil weakness).
  "ratio-gold-oil": async ({ load }) => {
    const g = await load("gold");
    const o = await load("oil");
    if (!g || !o) return [];
    return ratioSeries(g.points, o.points);
  },
};

export function isDerived(symbol: string): boolean {
  return symbol in DERIVED;
}
