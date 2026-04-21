import type { PricePoint, Timeframe } from "./types";

export function filterByTimeframe(
  points: PricePoint[],
  tf: Timeframe,
): PricePoint[] {
  if (tf === "ALL" || points.length === 0) return points;
  const last = new Date(points[points.length - 1].t);
  const cutoff = new Date(last);
  switch (tf) {
    case "1M": cutoff.setMonth(cutoff.getMonth() - 1); break;
    case "3M": cutoff.setMonth(cutoff.getMonth() - 3); break;
    case "6M": cutoff.setMonth(cutoff.getMonth() - 6); break;
    case "1Y": cutoff.setFullYear(cutoff.getFullYear() - 1); break;
    case "5Y": cutoff.setFullYear(cutoff.getFullYear() - 5); break;
    case "10Y": cutoff.setFullYear(cutoff.getFullYear() - 10); break;
    case "20Y": cutoff.setFullYear(cutoff.getFullYear() - 20); break;
  }
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  // Binary search for first index ≥ cutoff
  let lo = 0, hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].t < cutoffIso) lo = mid + 1;
    else hi = mid;
  }
  return points.slice(lo);
}

export function percentChange(points: PricePoint[]): number | null {
  if (points.length < 2) return null;
  const first = points[0].c;
  const last = points[points.length - 1].c;
  if (!Number.isFinite(first) || first === 0) return null;
  return ((last - first) / first) * 100;
}
