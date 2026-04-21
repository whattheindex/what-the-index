import { ImageResponse } from "next/og";
import { ASSETS, getAsset } from "@/data/assets";
import { loadAsset } from "@/lib/data-loader";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { formatPrice, formatPercent, formatDate } from "@/lib/format";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";

// Per-asset Open Graph image. Next.js evaluates this at build time (because
// the parent route is fully static via generateStaticParams) and writes one
// PNG per asset × locale into the build output. Each asset page's <meta>
// tags then point social-card crawlers at the generated URL.

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "What the Index — market chart";

// Duplicate the parent route's generateStaticParams so Next.js knows to
// emit every combination at build time rather than on-demand at runtime.
export function generateStaticParams() {
  const out: { locale: string; symbol: string }[] = [];
  for (const locale of LOCALES) {
    for (const a of ASSETS) out.push({ locale, symbol: a.symbol });
  }
  return out;
}

// Compute an SVG path for a simple sparkline that fills the given viewport.
// `points` is sampled from the series; we subsample to keep the path
// manageable when the underlying series has 15k+ daily points.
function sparklinePath(
  points: { t: string; c: number }[],
  width: number,
  height: number,
): string {
  if (points.length < 2) return "";
  const MAX = 240;
  const step = Math.max(1, Math.floor(points.length / MAX));
  const sampled = [];
  for (let i = 0; i < points.length; i += step) sampled.push(points[i]);
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }
  let min = Infinity;
  let max = -Infinity;
  for (const p of sampled) {
    if (p.c < min) min = p.c;
    if (p.c > max) max = p.c;
  }
  const range = max - min || 1;
  const stepX = width / (sampled.length - 1);
  let d = "";
  for (let i = 0; i < sampled.length; i++) {
    const x = i * stepX;
    const y = height - ((sampled[i].c - min) / range) * height;
    d += i === 0 ? `M${x.toFixed(1)},${y.toFixed(1)}` : ` L${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return d;
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}) {
  const { locale, symbol } = await params;
  const loc: Locale = isLocale(locale) ? locale : "en";
  const asset = getAsset(symbol);
  const series = await loadAsset(symbol);

  // Fallback image if the asset went missing. Still returns 1200×630
  // so crawlers don't 404 the og:image URL.
  if (!asset || !series) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a0d",
            color: "#e8e8ea",
            fontSize: 48,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          What the Index
        </div>
      ),
      { ...size },
    );
  }

  const window = filterByTimeframe(series.points, "1Y");
  const change = percentChange(window);
  const latest = series.points[series.points.length - 1];
  const up = (change ?? 0) >= 0;
  const chartW = 1120;
  const chartH = 240;
  const path = sparklinePath(window, chartW, chartH);
  const lineColor = up ? "#4ade80" : "#f87171";
  const glowColor = up ? "rgba(74, 222, 128, 0.12)" : "rgba(248, 113, 113, 0.12)";

  const title = asset.name;
  const value = latest ? formatPrice(latest.c, asset.currency, asset.unit) : "—";
  const changeLabel = change !== null ? `${formatPercent(change)} · 1Y` : "";
  const asOf = latest ? formatDate(latest.t) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0d",
          color: "#e8e8ea",
          fontFamily: "system-ui, sans-serif",
          padding: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#a0a0a8",
            fontSize: 20,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#7dd3fc",
              }}
            />
            <span>What the Index</span>
          </div>
          <span style={{ fontSize: 16, letterSpacing: 1 }}>
            {asset.category}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 34,
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 600, letterSpacing: -1 }}>
            {title}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 24,
              marginTop: 10,
            }}
          >
            <div style={{ fontSize: 80, fontWeight: 600, letterSpacing: -1 }}>
              {value}
            </div>
            {changeLabel && (
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  color: lineColor,
                }}
              >
                {changeLabel}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            borderRadius: 16,
            background: glowColor,
            border: "1px solid #26262c",
            padding: 16,
          }}
        >
          <svg
            width={chartW}
            height={chartH}
            viewBox={`0 0 ${chartW} ${chartH}`}
            preserveAspectRatio="none"
          >
            <path
              d={path}
              fill="none"
              stroke={lineColor}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#6a6a72",
            fontSize: 18,
            marginTop: "auto",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span>
            {loc === "de"
              ? `Stand ${asOf}`
              : loc === "ru"
                ? `Данные на ${asOf}`
                : `Data through ${asOf}`}
          </span>
          <span>whattheindex.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
