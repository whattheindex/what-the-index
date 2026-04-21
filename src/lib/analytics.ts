// Small pure helpers layered on top of raw price series. Used by the asset
// chart to compute the ATH/ATL panel, the drawdown overlay, and anything
// else we derive per-asset on the fly.

import type { PricePoint } from "./types";

export type SeriesStats = {
  ath: PricePoint;
  atl: PricePoint;
  // Percent below the all-time high, always ≤ 0. Null if the series has
  // a zero/negative ATH (shouldn't happen for prices, but guarded for
  // yield series which can sit at 0).
  currentDrawdown: number | null;
  // Calendar days between the all-time high and the latest point.
  daysSinceAth: number;
};

// Scan once to find the max and min. Ties go to the earliest occurrence —
// if a series prints the same peak twice, we want the original date.
export function seriesStats(points: PricePoint[]): SeriesStats | null {
  if (points.length === 0) return null;
  let athIdx = 0;
  let atlIdx = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].c > points[athIdx].c) athIdx = i;
    if (points[i].c < points[atlIdx].c) atlIdx = i;
  }
  const ath = points[athIdx];
  const atl = points[atlIdx];
  const last = points[points.length - 1];
  const currentDrawdown =
    ath.c > 0 ? ((last.c - ath.c) / ath.c) * 100 : null;
  const daysSinceAth = Math.max(
    0,
    Math.floor(
      (new Date(last.t).getTime() - new Date(ath.t).getTime()) /
        (24 * 60 * 60 * 1000),
    ),
  );
  return { ath, atl, currentDrawdown, daysSinceAth };
}

// Transform a price series into a drawdown series: at each point, the
// percent below the running maximum seen so far. Always ≤ 0, starts at 0.
// Used to render a "how far below peak are we?" cycle chart.
export function drawdownSeries(points: PricePoint[]): PricePoint[] {
  if (points.length === 0) return [];
  const out: PricePoint[] = new Array(points.length);
  let max = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const c = points[i].c;
    if (c > max) max = c;
    // If max is non-positive (edge case for yield series), skip ratio math.
    const dd = max > 0 ? ((c - max) / max) * 100 : 0;
    out[i] = { t: points[i].t, c: dd };
  }
  return out;
}
