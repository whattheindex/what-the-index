import type { CpiSeries, PricePoint } from "./types";

// Align two series on a common monthly grid. For daily inputs the last
// observation of each month is used (end-of-month snapshot). Months where one
// side has no value or the denominator is zero are skipped.
export function alignMonthly(
  a: PricePoint[],
  b: PricePoint[],
): { t: string; a: number; b: number }[] {
  const aByMonth = new Map<string, number>();
  const bByMonth = new Map<string, number>();
  // Walk in order so later (later-dated) observations in the same month win.
  for (const p of a) aByMonth.set(p.t.slice(0, 7), p.c);
  for (const p of b) bByMonth.set(p.t.slice(0, 7), p.c);

  const months = Array.from(
    new Set<string>([...aByMonth.keys(), ...bByMonth.keys()]),
  ).sort();

  const out: { t: string; a: number; b: number }[] = [];
  for (const m of months) {
    const av = aByMonth.get(m);
    const bv = bByMonth.get(m);
    if (av === undefined || bv === undefined) continue;
    if (!Number.isFinite(av) || !Number.isFinite(bv) || bv === 0) continue;
    out.push({ t: `${m}-01`, a: av, b: bv });
  }
  return out;
}

export function ratioSeries(
  num: PricePoint[],
  den: PricePoint[],
): PricePoint[] {
  return alignMonthly(num, den).map((r) => ({ t: r.t, c: r.a / r.b }));
}

// Inner-join two series by exact date match. Use when both inputs are daily
// (yield spreads, daily ratios) — we keep every date where both sides have
// a value and skip the rest. Preserves the finer daily resolution that
// alignMonthly would throw away.
export function alignDaily(
  a: PricePoint[],
  b: PricePoint[],
): { t: string; a: number; b: number }[] {
  const bByDate = new Map<string, number>();
  for (const p of b) bByDate.set(p.t, p.c);
  const out: { t: string; a: number; b: number }[] = [];
  for (const p of a) {
    const bv = bByDate.get(p.t);
    if (bv === undefined) continue;
    if (!Number.isFinite(p.c) || !Number.isFinite(bv)) continue;
    out.push({ t: p.t, a: p.c, b: bv });
  }
  return out;
}

// CPI year-over-year inflation rate, in percent. For each monthly point,
// compare to the value 12 months earlier. Skips the first year where no
// comparable prior reading exists.
export function cpiYoYSeries(cpi: CpiSeries): PricePoint[] {
  const byMonth = new Map<string, number>();
  for (const p of cpi.points) byMonth.set(p.t.slice(0, 7), p.v);
  const out: PricePoint[] = [];
  for (const p of cpi.points) {
    // One year earlier, same month. Just subtract 1 from the yyyy part —
    // robust for the "yyyy-mm" slice compared to Date math around DST.
    const [y, m] = p.t.slice(0, 7).split("-");
    const prevKey = `${Number(y) - 1}-${m}`;
    const prevV = byMonth.get(prevKey);
    if (prevV === undefined || prevV === 0) continue;
    const yoy = ((p.v - prevV) / prevV) * 100;
    if (!Number.isFinite(yoy)) continue;
    out.push({ t: p.t, c: yoy });
  }
  return out;
}

export function stats(points: PricePoint[]): {
  current: number | null;
  min: number | null;
  max: number | null;
  percentile: number | null;
} {
  if (points.length === 0) {
    return { current: null, min: null, max: null, percentile: null };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const p of points) {
    if (p.c < min) min = p.c;
    if (p.c > max) max = p.c;
  }
  const current = points[points.length - 1].c;
  // Percentile: fraction of observations ≤ current.
  let leq = 0;
  for (const p of points) if (p.c <= current) leq++;
  const pct = (leq / points.length) * 100;
  return { current, min, max, percentile: pct };
}
