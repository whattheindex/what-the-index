#!/usr/bin/env node
// Data ingestion. Two sources:
//   1. FRED (St. Louis Fed) — free CSV, no auth, very reliable.
//   2. datahub.io (Shiller & gold-prices datasets) — free raw GitHub CSVs.
// Writes one JSON per asset to public/data/.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "public/data");

const UA = "what-the-index/0.1 (ingestion script)";

// Each task produces one public/data/<symbol>.json file.
const TASKS = [
  // Indices
  { symbol: "nasdaq", name: "Nasdaq Composite", currency: "USD", type: "fred", series: "NASDAQCOM" },
  // S&P 500 is stitched: Shiller's monthly series gives us 1871+, FRED's
  // official daily SP500 (last ~10 years, licensing cap) layers on top.
  {
    symbol: "sp500",
    name: "S&P 500",
    currency: "USD",
    type: "stitch-sp500",
    shiller: "https://raw.githubusercontent.com/datasets/s-and-p-500/master/data/data.csv",
    fred: "SP500",
  },
  { symbol: "djia", name: "Dow Jones Industrial Average", currency: "USD", type: "fred", series: "DJIA" },
  { symbol: "djca", name: "Dow Jones Composite Average", currency: "USD", type: "fred", series: "DJCA" },
  { symbol: "djta", name: "Dow Jones Transportation Average", currency: "USD", type: "fred", series: "DJTA" },
  { symbol: "djua", name: "Dow Jones Utility Average", currency: "USD", type: "fred", series: "DJUA" },
  { symbol: "nasdaq100", name: "Nasdaq 100", currency: "USD", type: "fred", series: "NASDAQ100" },
  { symbol: "nikkei", name: "Nikkei 225", currency: "JPY", type: "fred", series: "NIKKEI225" },
  // World indices (DAX, FTSE, SMI, Hang Seng…) need a keyed provider:
  // - Stooq now requires a per-user API key (captcha-gated).
  // - Yahoo Finance v8 /chart works anonymously but 429-bans datacenter
  //   IPs aggressively, so it's unreliable from GitHub Actions.
  // - Alpha Vantage / Twelve Data / FMP all offer free keys with daily
  //   history for major indices.
  // If ALPHAVANTAGE_API_KEY is set, tasks marked `type: "alphavantage"`
  // will run; otherwise they're silently skipped.
  // Commodities
  // Gold — currently monthly only. FRED's London PM Fix series
  // (GOLDPMGBD228NLBM) was retired in 2024; Stooq and Yahoo both refuse
  // anonymous automated access. To upgrade to daily, provide an Alpha
  // Vantage or Twelve Data key (see note above) and we can add a
  // daily-overlay task.
  {
    symbol: "gold",
    name: "Gold",
    currency: "USD",
    type: "datahub-gold",
    url: "https://raw.githubusercontent.com/datasets/gold-prices/master/data/monthly.csv",
  },
  { symbol: "oil", name: "Crude Oil (WTI)", currency: "USD", type: "fred", series: "DCOILWTICO" },
  { symbol: "brent", name: "Crude Oil (Brent)", currency: "USD", type: "fred", series: "DCOILBRENTEU" },
  { symbol: "natgas", name: "Natural Gas (Henry Hub)", currency: "USD", type: "fred", series: "DHHNGSP" },
  { symbol: "copper", name: "Copper", currency: "USD", type: "fred", series: "PCOPPUSDM" },
  { symbol: "aluminum", name: "Aluminum", currency: "USD", type: "fred", series: "PALUMUSDM" },
  { symbol: "wheat", name: "Wheat", currency: "USD", type: "fred", series: "PWHEAMTUSDM" },
  // Crypto
  { symbol: "btc", name: "Bitcoin", currency: "USD", type: "fred", series: "CBBTCUSD" },
  { symbol: "eth", name: "Ethereum", currency: "USD", type: "fred", series: "CBETHUSD" },
  // FX — DEX series on FRED are reported as "units of X per one unit of Y".
  { symbol: "eurusd", name: "Euro / US Dollar", currency: "USD", type: "fred", series: "DEXUSEU" },
  { symbol: "gbpusd", name: "British Pound / US Dollar", currency: "USD", type: "fred", series: "DEXUSUK" },
  { symbol: "usdjpy", name: "US Dollar / Japanese Yen", currency: "JPY", type: "fred", series: "DEXJPUS" },
  { symbol: "usdchf", name: "US Dollar / Swiss Franc", currency: "CHF", type: "fred", series: "DEXSZUS" },
  { symbol: "usdcny", name: "US Dollar / Chinese Yuan", currency: "CNY", type: "fred", series: "DEXCHUS" },
  // Rates / vol
  { symbol: "vix", name: "VIX", currency: "USD", type: "fred", series: "VIXCLS" },
  { symbol: "us10y", name: "US 10-Year Treasury Yield", currency: "USD", type: "fred", series: "DGS10" },
  { symbol: "us2y", name: "US 2-Year Treasury Yield", currency: "USD", type: "fred", series: "DGS2" },
  { symbol: "mortgage30y", name: "US 30-Year Mortgage Rate", currency: "USD", type: "fred", series: "MORTGAGE30US" },
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function fredUrl(series) {
  return `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`;
}

function parseFred(csv, { allowZero = false } = {}) {
  // FRED uses "." for missing and sometimes 0 to mark market holidays for
  // index series. For asset prices, 0 is never meaningful, so drop those too.
  const lines = csv.trim().split(/\r?\n/);
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, val] = lines[i].split(",");
    const v = Number(val);
    if (!date || !Number.isFinite(v)) continue;
    if (!allowZero && v === 0) continue;
    points.push({ t: date, c: v });
  }
  return points;
}

function parseShiller(csv) {
  // Header: Date,SP500,Dividend,Earnings,Consumer Price Index,Long Interest Rate,Real Price,Real Dividend,Real Earnings,PE10
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",");
  const iDate = header.indexOf("Date");
  const iPrice = header.indexOf("SP500");
  if (iDate < 0 || iPrice < 0) throw new Error("Shiller CSV header unexpected");
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[iDate];
    const c = Number(cols[iPrice]);
    if (!date || !Number.isFinite(c)) continue;
    // Dates are yyyy-mm — pad to yyyy-mm-01
    const t = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
    points.push({ t, c });
  }
  return points;
}

function parseGold(csv) {
  // Header: Date,Price
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const iDate = header.indexOf("date");
  const iPrice = header.indexOf("price");
  if (iDate < 0 || iPrice < 0) throw new Error("Gold CSV header unexpected");
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const date = cols[iDate];
    const c = Number(cols[iPrice]);
    if (!date || !Number.isFinite(c)) continue;
    const t = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
    points.push({ t, c });
  }
  return points;
}

// If we later add a keyed provider (Alpha Vantage, Twelve Data, FMP), the
// fetch/parse helper goes here. Until then, keep the file focused on FRED
// + datahub sources that don't need credentials.

// Splice two chronologically ordered series. Anything in `base` on/after the
// first timestamp of `overlay` is dropped and replaced by `overlay`. Used to
// upgrade long-but-coarse historical series with a shorter-but-finer modern
// feed (e.g. Shiller monthly → FRED daily once FRED's 10-year window starts).
function stitch(base, overlay) {
  if (overlay.length === 0) return base;
  if (base.length === 0) return overlay;
  const cutover = overlay[0].t;
  const kept = base.filter((p) => p.t < cutover);
  return kept.concat(overlay);
}

async function fetchFred(series) {
  const csv = await fetchText(fredUrl(series));
  return parseFred(csv);
}


async function runTask(task) {
  console.log(`  → ${task.symbol.padEnd(10)} ${task.type}`);
  let points;
  let sourceLabel;
  if (task.type === "fred") {
    points = await fetchFred(task.series);
    sourceLabel = `FRED / ${task.series}`;
  } else if (task.type === "datahub-shiller") {
    points = parseShiller(await fetchText(task.url));
    sourceLabel = "Shiller (datahub.io)";
  } else if (task.type === "datahub-gold") {
    points = parseGold(await fetchText(task.url));
    sourceLabel = "datahub.io/core/gold-prices";
  } else if (task.type === "stitch-sp500") {
    // Try both sources. If FRED fails (e.g. network hiccup or series retired),
    // still fall back to Shiller-only so we never produce an empty file.
    const shillerPoints = parseShiller(await fetchText(task.shiller));
    let fredPoints = [];
    try {
      fredPoints = await fetchFred(task.fred);
    } catch (e) {
      console.warn(`    ! FRED ${task.fred} failed, using Shiller only: ${e.message}`);
    }
    points = stitch(shillerPoints, fredPoints);
    sourceLabel =
      fredPoints.length > 0
        ? `Shiller (datahub.io) + FRED / ${task.fred}`
        : "Shiller (datahub.io)";
  } else {
    throw new Error(`Unknown task type: ${task.type}`);
  }
  if (points.length === 0) throw new Error("No points parsed");
  const out = {
    symbol: task.symbol,
    name: task.name,
    currency: task.currency,
    source: sourceLabel,
    fetchedAt: new Date().toISOString(),
    points,
  };
  await writeFile(resolve(OUT_DIR, `${task.symbol}.json`), JSON.stringify(out));
  console.log(
    `    ✓ ${points.length} points, ${points[0].t} → ${points[points.length - 1].t}`,
  );
}

async function ingestCpi() {
  const url = fredUrl("CPIAUCSL");
  console.log(`  → cpi-us     CPIAUCSL`);
  const csv = await fetchText(url);
  const lines = csv.trim().split(/\r?\n/);
  const points = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, val] = lines[i].split(",");
    const v = Number(val);
    // Skip missing ("."), NaN, and FRED's occasional 0 placeholder for
    // not-yet-released months. CPI is never zero or negative.
    if (!date || !Number.isFinite(v) || v <= 0) continue;
    points.push({ t: date, v });
  }
  if (points.length === 0) throw new Error("No CPI data parsed");
  const out = {
    series: "CPIAUCSL",
    name: "US CPI (All Urban Consumers, Seasonally Adjusted)",
    source: "FRED — CPIAUCSL",
    fetchedAt: new Date().toISOString(),
    points,
  };
  await writeFile(resolve(OUT_DIR, "cpi-us.json"), JSON.stringify(out));
  console.log(
    `    ✓ ${points.length} points, ${points[0].t} → ${points[points.length - 1].t}`,
  );
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log("Ingesting assets…");
  const ok = [];
  const failed = [];
  for (const task of TASKS) {
    try {
      await runTask(task);
      ok.push(task.symbol);
    } catch (err) {
      console.error(`    ✗ ${task.symbol}: ${err.message}`);
      failed.push(task.symbol);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log("\nIngesting CPI (for inflation adjustment)…");
  try {
    await ingestCpi();
    ok.push("cpi-us");
  } catch (err) {
    console.error(`    ✗ cpi-us: ${err.message}`);
    failed.push("cpi-us");
  }
  console.log(`\nDone. ${ok.length} succeeded, ${failed.length} failed.`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
