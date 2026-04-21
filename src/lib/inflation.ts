import type { CpiSeries, PricePoint } from "./types";

// Given monthly CPI and a series of points, returns inflation-adjusted points
// expressed in dollars of the latest CPI observation. A point with date T uses
// the CPI for the first day of T's month. Dates earlier than the earliest CPI
// observation are dropped (CPI goes back to 1947).
export function toRealSeries(
  points: PricePoint[],
  cpi: CpiSeries,
): PricePoint[] {
  if (cpi.points.length === 0 || points.length === 0) return [];
  const cpiLatest = cpi.points[cpi.points.length - 1].v;

  // Build yyyy-mm → CPI lookup for fast access.
  const byMonth = new Map<string, number>();
  for (const p of cpi.points) byMonth.set(p.t.slice(0, 7), p.v);

  const monthsSorted = Array.from(byMonth.keys()).sort();
  const earliestMonth = monthsSorted[0];
  const latestMonth = monthsSorted[monthsSorted.length - 1];

  const out: PricePoint[] = [];
  for (const p of points) {
    const month = p.t.slice(0, 7);
    if (month < earliestMonth) continue;
    // For observations beyond the latest CPI month, fall back to the latest CPI.
    const cpiAt = byMonth.get(month) ?? byMonth.get(latestMonth)!;
    if (!Number.isFinite(cpiAt) || cpiAt <= 0) continue;
    const real = (p.c * cpiLatest) / cpiAt;
    if (!Number.isFinite(real)) continue;
    out.push({ t: p.t, c: real });
  }
  return out;
}
