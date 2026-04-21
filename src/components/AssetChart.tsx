"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createChart,
  createSeriesMarkers,
  AreaSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type LineData,
  type MouseEventParams,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import type { PricePoint, Timeframe, CpiSeries } from "@/lib/types";
import { TIMEFRAMES } from "@/lib/types";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { toRealSeries } from "@/lib/inflation";
import { formatPrice, formatPercent, formatDate } from "@/lib/format";
import { readChartPalette } from "@/lib/chart-theme";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/i18n/context";
import {
  renderExportCanvas,
  downloadPng,
  downloadPdf,
  type ExportMeta,
} from "@/lib/export-chart";
import { seriesStats, drawdownSeries } from "@/lib/analytics";
import { EVENTS } from "@/data/events";
import type { Locale } from "@/i18n/config";

type Props = {
  symbol: string;
  name: string;
  currency: string;
  unit?: string;
  nominal: PricePoint[];
  cpi: CpiSeries | null;
  source?: string;
};

type Scale = "linear" | "log";

// URL query shape: ?tf=ALL&scale=log&real=1&dd=1&ev=1
const DEFAULTS = {
  tf: "ALL" as Timeframe,
  scale: "linear" as Scale,
  real: false,
  dd: false,
  ev: false,
};

// Timeframe keyboard shortcuts — index-based so 1=1M … 8=ALL.
const TF_KEYS: Record<string, Timeframe> = {
  "1": "1M", "2": "3M", "3": "6M", "4": "1Y",
  "5": "5Y", "6": "10Y", "7": "20Y", "8": "ALL",
};

// Timeframes shown in the Multi-Return bar. Deliberately shorter than the
// main Timeframe selector — 6M and 20Y add clutter without insight in this
// context. Each one is also a click target to jump the chart to that range.
const RETURN_TFS: Timeframe[] = ["1M", "3M", "1Y", "5Y", "10Y", "ALL"];

export function AssetChart({ symbol, name, currency, unit, nominal, cpi, source }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const timeframe = (TIMEFRAMES.includes(searchParams.get("tf") as Timeframe)
    ? (searchParams.get("tf") as Timeframe)
    : DEFAULTS.tf);
  const scale: Scale = searchParams.get("scale") === "log" ? "log" : "linear";
  const real = searchParams.get("real") === "1";
  const drawdown = searchParams.get("dd") === "1";
  const events = searchParams.get("ev") === "1";

  const updateQuery = useCallback(
    (patch: Partial<{ tf: Timeframe; scale: Scale; real: boolean; dd: boolean; ev: boolean }>) => {
      const params = new URLSearchParams(searchParams.toString());
      const write = (key: string, value: string | null, defaultValue: string) => {
        if (value === null || value === defaultValue) params.delete(key);
        else params.set(key, value);
      };
      if (patch.tf !== undefined) write("tf", patch.tf, DEFAULTS.tf);
      if (patch.scale !== undefined) write("scale", patch.scale, DEFAULTS.scale);
      if (patch.real !== undefined) write("real", patch.real ? "1" : "0", "0");
      if (patch.dd !== undefined) write("dd", patch.dd ? "1" : "0", "0");
      if (patch.ev !== undefined) write("ev", patch.ev ? "1" : "0", "0");
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const realSeries = useMemo(
    () => (cpi ? toRealSeries(nominal, cpi) : []),
    [nominal, cpi],
  );
  const realAvailable = !!cpi && realSeries.length > 0;

  // Base price series for this view (nominal or CPI-adjusted).
  const activeSeries = real && realAvailable ? realSeries : nominal;

  // Drawdown transform over the full history — so peaks outside the visible
  // window still anchor the running max. Lazy: only compute when toggled on.
  const drawdownFull = useMemo(
    () => (drawdown ? drawdownSeries(activeSeries) : []),
    [drawdown, activeSeries],
  );

  // What the chart actually renders: price or drawdown series, trimmed to
  // the selected timeframe.
  const chartPoints = useMemo(
    () => filterByTimeframe(drawdown ? drawdownFull : activeSeries, timeframe),
    [drawdown, drawdownFull, activeSeries, timeframe],
  );

  // Price-series within the current window — used for the header's
  // "timeframe return" number. In drawdown mode we still want to surface
  // the price change over the window (drawdown alone doesn't tell you
  // whether the window started near a peak).
  const pricePoints = useMemo(
    () => filterByTimeframe(activeSeries, timeframe),
    [activeSeries, timeframe],
  );

  const change = percentChange(pricePoints);
  const latest = pricePoints[pricePoints.length - 1];
  const first = pricePoints[0];

  // Multi-return bar: the timeframe-return for each well-known window,
  // always computed on the price series (drawdown mode keeps this info
  // useful as a reference row).
  const returns = useMemo(
    () =>
      RETURN_TFS.map((tf) => ({
        tf,
        change: percentChange(filterByTimeframe(activeSeries, tf)),
      })),
    [activeSeries],
  );

  // ATH/ATL over the full series, respecting the current real/nominal
  // toggle so the user can explore both regimes.
  const stats = useMemo(() => seriesStats(activeSeries), [activeSeries]);

  // Hovered chart point — lit up by the crosshair subscription below.
  const [hoveredPoint, setHoveredPoint] = useState<PricePoint | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const { theme } = useTheme();
  const { t, locale } = useI18n();

  const exportImage = useCallback(
    async (kind: "png" | "pdf") => {
      const chart = chartRef.current;
      if (!chart) return;
      const snap = chart.takeScreenshot();
      // The rendered screenshot matches whatever view mode is active —
      // build the meta to match, so drawdown mode exports say "drawdown"
      // (not a misleading price header).
      const lastChart = chartPoints[chartPoints.length - 1];
      const firstChart = chartPoints[0];
      const value = drawdown
        ? lastChart
          ? `${lastChart.c.toFixed(2)}%`
          : "—"
        : latest
          ? formatPrice(latest.c, currency, unit)
          : "—";
      const badges: string[] = [timeframe];
      if (!drawdown) {
        badges.push(scale === "log" ? t("chart.log") : t("chart.linear"));
      }
      badges.push(real ? t("chart.real") : t("chart.nominal"));
      if (drawdown) badges.push(t("chart.drawdown"));
      const meta: ExportMeta = {
        title: name,
        subtitle: symbol,
        value,
        change: !drawdown && change !== null ? formatPercent(change) : undefined,
        changePositive: (change ?? 0) >= 0,
        range:
          firstChart && lastChart
            ? `${formatDate(firstChart.t)} – ${formatDate(lastChart.t)}`
            : "",
        badges,
        footerLeft: source ? `Source: ${source}` : undefined,
        footerRight: "whattheindex.com",
      };
      const composite = renderExportCanvas(
        snap,
        meta,
        theme === "light" ? "light" : "dark",
      );
      const filename = `${symbol}-${timeframe}${real ? "-real" : ""}${scale === "log" ? "-log" : ""}${drawdown ? "-drawdown" : ""}`;
      if (kind === "png") downloadPng(composite, filename);
      else await downloadPdf(composite, filename);
    },
    [
      name,
      symbol,
      currency,
      unit,
      latest,
      change,
      chartPoints,
      timeframe,
      scale,
      real,
      drawdown,
      source,
      theme,
      t,
    ],
  );

  useEffect(() => {
    if (!containerRef.current) return;
    const p = readChartPalette();
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: "transparent" },
        textColor: p.text,
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: p.grid },
        horzLines: { color: p.grid },
      },
      rightPriceScale: {
        borderColor: p.border,
        scaleMargins: { top: 0.1, bottom: 0.08 },
      },
      timeScale: {
        borderColor: p.border,
        rightOffset: 2,
        // Default is 0.5px per bar; a 60-year daily series (~16k bars) would
        // silently clip to the last ~1000 bars. Allow much tighter packing.
        minBarSpacing: 0.001,
      },
      crosshair: {
        vertLine: { color: p.crosshair, style: LineStyle.Dashed, width: 1, labelBackgroundColor: p.crosshair },
        horzLine: { color: p.crosshair, style: LineStyle.Dashed, width: 1, labelBackgroundColor: p.crosshair },
      },
    });
    const series = chart.addSeries(AreaSeries, {
      lineColor: p.accent,
      topColor: p.accentFillTop,
      bottomColor: p.accentFillBottom,
      lineWidth: 2,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Re-apply chart-chrome palette when the theme changes. Series colors
  // are handled separately below (they also depend on drawdown mode).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const p = readChartPalette();
    chart.applyOptions({
      layout: { textColor: p.text },
      grid: { vertLines: { color: p.grid }, horzLines: { color: p.grid } },
      rightPriceScale: { borderColor: p.border },
      timeScale: { borderColor: p.border },
      crosshair: {
        vertLine: { color: p.crosshair, labelBackgroundColor: p.crosshair },
        horzLine: { color: p.crosshair, labelBackgroundColor: p.crosshair },
      },
    });
  }, [theme]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    const data: LineData[] = chartPoints.map((p) => ({
      time: p.t as Time,
      value: p.c,
    }));
    series.setData(data);
    if (data.length >= 2) {
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: data.length - 1 });
    }
  }, [chartPoints]);

  // Log scale is meaningless for drawdown (all values ≤ 0), so fall back to
  // linear when drawdown is on — no matter what `scale` says. We keep the
  // user's scale preference in the URL so flipping drawdown off restores it.
  useEffect(() => {
    chartRef.current
      ?.priceScale("right")
      .applyOptions({ mode: !drawdown && scale === "log" ? 1 : 0 });
  }, [scale, drawdown]);

  // Drawdown mode re-skins the series: always-red fill, percent axis labels.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const p = readChartPalette();
    if (drawdown) {
      series.applyOptions({
        lineColor: p.crosshair /* neutral — overridden by down tint below */,
        topColor: "rgba(248, 113, 113, 0.02)",
        bottomColor: "rgba(248, 113, 113, 0.25)",
        priceFormat: {
          type: "custom",
          formatter: (v: number) => `${v.toFixed(1)}%`,
          minMove: 0.01,
        },
      });
      // Override with the proper down accent so the line reads "negative".
      series.applyOptions({ lineColor: "#f87171" });
    } else {
      series.applyOptions({
        lineColor: p.accent,
        topColor: p.accentFillTop,
        bottomColor: p.accentFillBottom,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      });
    }
  }, [drawdown, theme]);

  // Historical-event markers. Snapped to the nearest data point so they
  // appear on the line, not in empty air between daily/monthly readings.
  // Only events that fall within the full series' date range are shown.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || activeSeries.length === 0) return;
    if (!events) {
      markersRef.current?.setMarkers([]);
      return;
    }
    const firstT = activeSeries[0].t;
    const lastT = activeSeries[activeSeries.length - 1].t;
    // Pre-sort by time so binary search can find the nearest data point
    // for each event's date.
    const times = activeSeries.map((p) => p.t);
    const nearestIdx = (iso: string): number | null => {
      if (iso < firstT || iso > lastT) return null;
      let lo = 0;
      let hi = times.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (times[mid] < iso) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    };
    const m: SeriesMarker<Time>[] = [];
    for (const ev of EVENTS) {
      const idx = nearestIdx(ev.t);
      if (idx === null) continue;
      m.push({
        time: activeSeries[idx].t as Time,
        position: "aboveBar",
        // A muted neutral tone — we don't want the markers competing with
        // the series itself for attention. Users can read labels on hover.
        color: "#a0a0a8",
        shape: "circle",
        size: 1,
        text: ev.label[locale as Locale] ?? ev.label.en,
      });
    }
    if (!markersRef.current) {
      markersRef.current = createSeriesMarkers(series, m);
    } else {
      markersRef.current.setMarkers(m);
    }
  }, [events, activeSeries, locale]);

  // Crosshair-move → header readout. Re-subscribes whenever the visible
  // data changes so the lookup has the latest points to find matches in.
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    // Build an O(1) lookup from time-string to point for fast hover.
    const lookup = new Map<string, PricePoint>();
    for (const p of chartPoints) lookup.set(p.t, p);
    const handler = (param: MouseEventParams) => {
      if (!param.time) {
        setHoveredPoint(null);
        return;
      }
      // Our time axis uses ISO date strings, so this cast is safe.
      const t = param.time as string;
      setHoveredPoint(lookup.get(t) ?? null);
    };
    chart.subscribeCrosshairMove(handler);
    return () => chart.unsubscribeCrosshairMove(handler);
  }, [chartPoints]);

  // Keyboard: 1-8 = timeframes, L = log/linear, I = inflation, D = drawdown
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (TF_KEYS[k]) {
        updateQuery({ tf: TF_KEYS[k] });
        e.preventDefault();
        return;
      }
      if (k === "l") {
        updateQuery({ scale: scale === "log" ? "linear" : "log" });
        e.preventDefault();
        return;
      }
      if (k === "i") {
        if (realAvailable) updateQuery({ real: !real });
        e.preventDefault();
        return;
      }
      if (k === "d") {
        updateQuery({ dd: !drawdown });
        e.preventDefault();
        return;
      }
      if (k === "e") {
        updateQuery({ ev: !events });
        e.preventDefault();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [updateQuery, scale, real, realAvailable, drawdown, events]);

  const rangeLabel = first && latest ? `${formatDate(first.t)} – ${formatDate(latest.t)}` : "";

  // Header read-out — the big number + change line at the top. Follows the
  // crosshair when the user hovers over the chart, so you can precisely
  // read off any historical point without squinting at the axis label.
  const displayPoint = hoveredPoint ?? chartPoints[chartPoints.length - 1];
  const headerValue = displayPoint
    ? drawdown
      ? `${displayPoint.c.toFixed(2)}%`
      : formatPrice(displayPoint.c, currency, unit)
    : "—";
  // In price mode, show the change from window-start to the displayed
  // point. Hovering a historical point thus reveals "what was the return
  // up to this day" — useful for reading peaks/troughs.
  let headerChange: number | null = null;
  if (!drawdown && first && displayPoint && first.c !== 0) {
    // In price mode, chartPoints === pricePoints, so displayPoint is a
    // price point in the same series as `first`.
    headerChange = ((displayPoint.c - first.c) / first.c) * 100;
  }
  const headerDate = hoveredPoint ? formatDate(hoveredPoint.t) : rangeLabel;
  const modeLabel = drawdown
    ? t("chart.drawdown")
    : real
      ? t("chart.real")
      : t("chart.nominal");
  const headerChangeTone = drawdown
    ? "text-[var(--down)]"
    : (headerChange ?? 0) >= 0
      ? "text-[var(--up)]"
      : "text-[var(--down)]";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-0.5">
          <div className="text-[var(--foreground-muted)] text-xs uppercase tracking-wider font-mono">
            {modeLabel}
          </div>
          <div className="flex items-baseline gap-3">
            <div
              className={`text-3xl font-semibold tracking-tight tabular-nums ${drawdown ? "text-[var(--down)]" : ""}`}
            >
              {headerValue}
            </div>
            {!drawdown && headerChange !== null && (
              <div className={`text-base font-medium tabular-nums ${headerChangeTone}`}>
                {formatPercent(headerChange)}
              </div>
            )}
          </div>
          <div className="text-xs text-[var(--foreground-dim)] mt-1">{headerDate}</div>
        </div>
      </div>

      <ReturnsBar
        returns={returns}
        current={timeframe}
        onPick={(tf) => updateQuery({ tf })}
        label={t("chart.returns")}
      />

      {stats && (
        <StatsRow
          stats={stats}
          currency={currency}
          unit={unit}
          t={t}
          now={latest?.t}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          label={t("chart.timeframe")}
          options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
          value={timeframe}
          onChange={(v) => updateQuery({ tf: v as Timeframe })}
        />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <SegmentedControl
            label={t("chart.scale")}
            options={[
              { value: "linear", label: t("chart.linear") },
              { value: "log", label: t("chart.log") },
            ]}
            value={scale}
            onChange={(v) => updateQuery({ scale: v as Scale })}
          />
          <Toggle
            label={real ? t("chart.realToggle") : t("chart.nominalToggle")}
            on={real}
            disabled={!realAvailable}
            onToggle={() => updateQuery({ real: !real })}
          />
          <Toggle
            label={t("chart.drawdown")}
            on={drawdown}
            onToggle={() => updateQuery({ dd: !drawdown })}
          />
          <Toggle
            label={t("chart.events")}
            on={events}
            onToggle={() => updateQuery({ ev: !events })}
          />
          <ExportMenu
            label={t("chart.export")}
            pngLabel={t("chart.exportPng")}
            pdfLabel={t("chart.exportPdf")}
            onExport={exportImage}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[480px] w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-2"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--foreground-dim)]">
        <span>
          {name} · {symbol}
          {drawdown
            ? ` · ${t("chart.drawdownNote")}`
            : real
              ? ` · ${t("chart.realNote")}`
              : ""}
        </span>
        <span className="hidden sm:inline font-mono">
          {renderKeysHint(
            t("chart.keysHint", {
              k1: "__K1__",
              k2: "__K2__",
              lk: "__LK__",
              ik: "__IK__",
              sk: "__SK__",
            }),
          )}
        </span>
      </div>
    </div>
  );
}

function ReturnsBar({
  returns,
  current,
  onPick,
  label,
}: {
  returns: { tf: Timeframe; change: number | null }[];
  current: Timeframe;
  onPick: (tf: Timeframe) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-3 sm:grid-cols-6 gap-0 rounded-xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden"
    >
      {returns.map(({ tf, change }, i) => {
        const positive = (change ?? 0) >= 0;
        const active = tf === current;
        return (
          <button
            key={tf}
            onClick={() => onPick(tf)}
            className={`flex flex-col items-center justify-center gap-0.5 h-14 px-3 transition border-[var(--border)] ${
              i > 0 ? "sm:border-l" : ""
            } ${i % 3 !== 0 ? "border-l sm:border-l" : ""} ${
              i >= 3 ? "border-t sm:border-t-0" : ""
            } ${
              active
                ? "bg-[var(--background-hover)]"
                : "hover:bg-[var(--background-hover)]"
            }`}
            aria-pressed={active}
          >
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
              {tf}
            </span>
            {change !== null ? (
              <span
                className={`text-sm font-medium tabular-nums ${
                  positive ? "text-[var(--up)]" : "text-[var(--down)]"
                }`}
              >
                {formatPercent(change)}
              </span>
            ) : (
              <span className="text-sm text-[var(--foreground-dim)]">—</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatsRow({
  stats,
  currency,
  unit,
  t,
  now,
}: {
  stats: NonNullable<ReturnType<typeof seriesStats>>;
  currency: string;
  unit?: string;
  t: (k: Parameters<ReturnType<typeof useI18n>["t"]>[0], v?: Record<string, string>) => string;
  now?: string;
}) {
  const { ath, atl, currentDrawdown, daysSinceAth } = stats;
  // "X years ago" feels right once we're past a year of drought; below
  // that, the day-count is more tangible than rounding to "0y ago".
  const ageLabel =
    daysSinceAth >= 365
      ? t("chart.yearsAgo", { years: Math.floor(daysSinceAth / 365).toString() })
      : t("chart.daysAgo", { days: daysSinceAth.toString() });
  const atAth = currentDrawdown !== null && currentDrawdown >= -0.05;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
          {t("chart.athShort")}
        </span>
        <span className="font-medium tabular-nums text-[var(--foreground)]">
          {formatPrice(ath.c, currency, unit)}
        </span>
        <span className="text-[var(--foreground-dim)]">
          {formatDate(ath.t)}
        </span>
      </div>
      {currentDrawdown !== null && (
        <div className="flex items-baseline gap-1.5">
          {atAth ? (
            <span className="font-medium text-[var(--up)]">
              {t("chart.atAth")}
            </span>
          ) : (
            <>
              <span className="font-medium tabular-nums text-[var(--down)]">
                {t("chart.belowAth", { pct: formatPercent(currentDrawdown) })}
              </span>
              <span className="text-[var(--foreground-dim)]">· {ageLabel}</span>
            </>
          )}
        </div>
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
          {t("chart.atlShort")}
        </span>
        <span className="font-medium tabular-nums text-[var(--foreground)]">
          {formatPrice(atl.c, currency, unit)}
        </span>
        <span className="text-[var(--foreground-dim)]">
          {formatDate(atl.t)}
        </span>
      </div>
    </div>
  );
}

// Splits a localized keys hint string (with __KEY__ placeholders) into
// an array of React nodes, wrapping each key in <Kbd>.
function renderKeysHint(s: string): React.ReactNode[] {
  const map: Record<string, React.ReactNode> = {
    __K1__: <Kbd key="k1">1</Kbd>,
    __K2__: <Kbd key="k2">8</Kbd>,
    __LK__: <Kbd key="lk">L</Kbd>,
    __IK__: <Kbd key="ik">I</Kbd>,
    __SK__: <Kbd key="sk">/</Kbd>,
  };
  const parts = s.split(/(__K1__|__K2__|__LK__|__IK__|__SK__)/g);
  return parts.map((part, i) => (map[part] !== undefined ? map[part] : <span key={i}>{part}</span>));
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded border border-[var(--border-strong)] bg-[var(--background-card)] text-[10px] font-mono text-[var(--foreground-muted)]">
      {children}
    </kbd>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 h-8 text-xs font-medium tabular-nums rounded-md transition ${
            value === o.value
              ? "bg-[var(--background-hover)] text-[var(--foreground)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`h-8 px-3 rounded-lg text-xs font-medium border transition ${
        on
          ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/40"
          : "bg-[var(--background-card)] text-[var(--foreground-muted)] border-[var(--border)] hover:text-[var(--foreground)]"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {label}
    </button>
  );
}

function ExportMenu({
  label,
  pngLabel,
  pdfLabel,
  onExport,
}: {
  label: string;
  pngLabel: string;
  pdfLabel: string;
  onExport: (kind: "png" | "pdf") => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const run = async (kind: "png" | "pdf") => {
    setOpen(false);
    setBusy(true);
    try {
      await onExport(kind);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium border border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] disabled:opacity-50 disabled:cursor-wait transition"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M8 2.5v8" />
          <path d="M4.5 7L8 10.5 11.5 7" />
          <path d="M3 13h10" />
        </svg>
        {label}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[180px] z-10 rounded-lg border border-[var(--border-strong)] bg-[var(--background-card)] shadow-lg overflow-hidden"
        >
          <button
            role="menuitem"
            onClick={() => run("png")}
            className="w-full text-left px-3 h-9 text-xs text-[var(--foreground)] hover:bg-[var(--background-hover)] transition"
          >
            {pngLabel}
          </button>
          <button
            role="menuitem"
            onClick={() => run("pdf")}
            className="w-full text-left px-3 h-9 text-xs text-[var(--foreground)] hover:bg-[var(--background-hover)] transition border-t border-[var(--border)]"
          >
            {pdfLabel}
          </button>
        </div>
      )}
    </div>
  );
}
