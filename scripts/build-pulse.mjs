#!/usr/bin/env node
// Precompute per-timeframe sparkline bundles.
//
// Home + Markets used to load 31 full AssetSeries on every render and
// re-filter/re-thin them per request. On Cloudflare Workers free plan
// (50ms CPU ceiling) that tipped into Error 1102. This script runs at
// build time and collapses the work into one tiny file per timeframe:
//
//   public/data/pulse/<tf>.json → { [symbol]: { points: PricePoint[] } }
//
// At runtime the Worker fetches ONE file, JSON.parses ONE object, and
// passes slices straight to the components. No server-side filtering.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = resolve(ROOT, "public/data");
const OUT_DIR = resolve(DATA_DIR, "pulse");
const SPARKLINE_MAX = 200;
const TIMEFRAMES = ["1M", "3M", "6M", "1Y", "5Y", "10Y", "20Y", "ALL"];

// Keep in sync with src/data/assets.ts. Listing the symbols here (rather
// than scanning public/data/*.json) ensures derived entries are included
// and primitive data files that shouldn't appear in the pulse (cpi-us)
// stay out.
const PRIMARY_SYMBOLS = [
  "sp500", "nasdaq", "djia", "djca", "djta", "djua", "nasdaq100", "nikkei",
  "gold", "oil", "brent", "natgas", "copper", "aluminum", "wheat",
  "btc", "eth",
  "eurusd", "gbpusd", "usdjpy", "usdchf", "usdcny",
  "vix", "us10y", "us2y", "mortgage30y",
];

const DERIVED_SYMBOLS = [
  "spread-10-2",
  "cpi-yoy",
  "real-yield-10y",
  "ratio-sp500-gold",
  "ratio-gold-oil",
];

function filterByTimeframe(points, tf) {
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
  let lo = 0, hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (points[mid].t < cutoffIso) lo = mid + 1;
    else hi = mid;
  }
  return points.slice(lo);
}

function thin(points, max) {
  if (points.length <= max) return points.slice();
  const step = (points.length - 1) / (max - 1);
  const out = new Array(max);
  for (let i = 0; i < max - 1; i++) out[i] = points[Math.floor(i * step)];
  out[max - 1] = points[points.length - 1];
  return out;
}

async function loadSeries(symbol) {
  try {
    const raw = await readFile(resolve(DATA_DIR, `${symbol}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadCpi() {
  try {
    const raw = await readFile(resolve(DATA_DIR, "cpi-us.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// --- derived helpers (ported from src/lib/align.ts + derived.ts) ---

function alignDaily(a, b) {
  const bByDate = new Map();
  for (const p of b) bByDate.set(p.t, p.c);
  const out = [];
  for (const p of a) {
    const bv = bByDate.get(p.t);
    if (bv === undefined) continue;
    if (!Number.isFinite(p.c) || !Number.isFinite(bv)) continue;
    out.push({ t: p.t, a: p.c, b: bv });
  }
  return out;
}

function alignMonthly(a, b) {
  const aByMonth = new Map();
  const bByMonth = new Map();
  for (const p of a) aByMonth.set(p.t.slice(0, 7), p.c);
  for (const p of b) bByMonth.set(p.t.slice(0, 7), p.c);
  const months = Array.from(
    new Set([...aByMonth.keys(), ...bByMonth.keys()]),
  ).sort();
  const out = [];
  for (const m of months) {
    const av = aByMonth.get(m);
    const bv = bByMonth.get(m);
    if (av === undefined || bv === undefined) continue;
    if (!Number.isFinite(av) || !Number.isFinite(bv) || bv === 0) continue;
    out.push({ t: `${m}-01`, a: av, b: bv });
  }
  return out;
}

function ratioSeries(num, den) {
  return alignMonthly(num, den).map((r) => ({ t: r.t, c: r.a / r.b }));
}

function cpiYoYSeries(cpi) {
  const byMonth = new Map();
  for (const p of cpi.points) byMonth.set(p.t.slice(0, 7), p.v);
  const out = [];
  for (const p of cpi.points) {
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

function monthEndSamples(daily) {
  const byMonth = new Map();
  for (const p of daily) byMonth.set(p.t.slice(0, 7), p);
  return Array.from(byMonth.values()).sort((a, b) =>
    a.t < b.t ? -1 : a.t > b.t ? 1 : 0,
  );
}

async function computeDerived(symbol, cache, cpi) {
  const get = (s) => cache.get(s);
  switch (symbol) {
    case "spread-10-2": {
      const a = get("us10y"), b = get("us2y");
      if (!a || !b) return [];
      return alignDaily(a.points, b.points).map((r) => ({ t: r.t, c: r.a - r.b }));
    }
    case "cpi-yoy":
      return cpi ? cpiYoYSeries(cpi) : [];
    case "real-yield-10y": {
      const y = get("us10y");
      if (!y || !cpi) return [];
      const monthly = monthEndSamples(y.points);
      const yoy = cpiYoYSeries(cpi);
      return alignMonthly(monthly, yoy).map((r) => ({ t: r.t, c: r.a - r.b }));
    }
    case "ratio-sp500-gold": {
      const s = get("sp500"), g = get("gold");
      if (!s || !g) return [];
      return ratioSeries(s.points, g.points);
    }
    case "ratio-gold-oil": {
      const g = get("gold"), o = get("oil");
      if (!g || !o) return [];
      return ratioSeries(g.points, o.points);
    }
    default:
      return [];
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const primaryCache = new Map();
  for (const symbol of PRIMARY_SYMBOLS) {
    const series = await loadSeries(symbol);
    if (series && series.points) primaryCache.set(symbol, series);
  }
  const cpi = await loadCpi();

  const derivedPoints = new Map();
  for (const symbol of DERIVED_SYMBOLS) {
    const points = await computeDerived(symbol, primaryCache, cpi);
    if (points.length > 0) derivedPoints.set(symbol, points);
  }

  for (const tf of TIMEFRAMES) {
    const bundle = {};
    for (const [symbol, series] of primaryCache) {
      const filtered = filterByTimeframe(series.points, tf);
      if (filtered.length === 0) continue;
      bundle[symbol] = { points: thin(filtered, SPARKLINE_MAX) };
    }
    for (const [symbol, points] of derivedPoints) {
      const filtered = filterByTimeframe(points, tf);
      if (filtered.length === 0) continue;
      bundle[symbol] = { points: thin(filtered, SPARKLINE_MAX) };
    }
    await writeFile(
      resolve(OUT_DIR, `${tf}.json`),
      JSON.stringify(bundle),
    );
  }

  const count = primaryCache.size + derivedPoints.size;
  console.log(
    `build-pulse: wrote ${TIMEFRAMES.length} timeframe bundles covering ${count} symbols`,
  );
}

await main();
