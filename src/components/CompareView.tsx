"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createChart,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import type { AssetSeriesLite, CpiSeries, PricePoint, Timeframe } from "@/lib/types";
import { TIMEFRAMES } from "@/lib/types";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { toRealSeries } from "@/lib/inflation";
import { formatPercent } from "@/lib/format";
import { readChartPalette } from "@/lib/chart-theme";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/i18n/context";

type Props = {
  assets: AssetSeriesLite[];
  cpi: CpiSeries | null;
};

type Scale = "linear" | "log";

// Accessible on-dark line colors. Line 1 is the canonical accent (sky-300).
const COLORS = [
  "#7dd3fc", // sky
  "#fca5a5", // red
  "#86efac", // green
  "#fcd34d", // amber
  "#c4b5fd", // violet
  "#f9a8d4", // pink
  "#67e8f9", // cyan
  "#fdba74", // orange
  "#a3e635", // lime
  "#e0e7ff", // indigo-ish
];

const DEFAULT_SYMBOLS = ["sp500", "gold", "btc"];

function parseSymbolList(raw: string | null, allSymbols: Set<string>): string[] {
  if (!raw) return [];
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of parts) {
    if (allSymbols.has(s) && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

function normalize(points: PricePoint[]): LineData[] {
  if (points.length === 0) return [];
  const base = points[0].c;
  if (!Number.isFinite(base) || base === 0) return [];
  return points.map((p) => ({
    time: p.t as Time,
    value: (p.c / base) * 100,
  }));
}

export function CompareView({ assets, cpi }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const allSymbols = useMemo(() => new Set(assets.map((a) => a.symbol)), [assets]);

  const selected = useMemo(() => {
    const fromUrl = parseSymbolList(searchParams.get("symbols"), allSymbols);
    if (fromUrl.length > 0) return fromUrl;
    return DEFAULT_SYMBOLS.filter((s) => allSymbols.has(s));
  }, [searchParams, allSymbols]);

  const timeframe: Timeframe = (
    TIMEFRAMES.includes(searchParams.get("tf") as Timeframe)
      ? searchParams.get("tf")
      : "10Y"
  ) as Timeframe;
  const scale: Scale = searchParams.get("scale") === "log" ? "log" : "linear";
  const real = searchParams.get("real") === "1";

  const updateQuery = useCallback(
    (patch: Partial<{ symbols: string[]; tf: Timeframe; scale: Scale; real: boolean }>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.symbols !== undefined) {
        if (patch.symbols.length === 0) params.delete("symbols");
        else params.set("symbols", patch.symbols.join(","));
      }
      if (patch.tf !== undefined) {
        if (patch.tf === "10Y") params.delete("tf");
        else params.set("tf", patch.tf);
      }
      if (patch.scale !== undefined) {
        if (patch.scale === "linear") params.delete("scale");
        else params.set("scale", patch.scale);
      }
      if (patch.real !== undefined) {
        if (!patch.real) params.delete("real");
        else params.set("real", "1");
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const toggleSymbol = useCallback(
    (symbol: string) => {
      const isOn = selected.includes(symbol);
      const next = isOn ? selected.filter((s) => s !== symbol) : [...selected, symbol];
      updateQuery({ symbols: next });
    },
    [selected, updateQuery],
  );

  // Build series for each selected symbol, optionally inflation-adjusted,
  // filtered by timeframe, and normalized to 100 at first visible point.
  const rows = useMemo(() => {
    return selected.map((sym, idx) => {
      const asset = assets.find((a) => a.symbol === sym)!;
      const source = real && cpi ? toRealSeries(asset.points, cpi) : asset.points;
      const visible = filterByTimeframe(source, timeframe);
      const normalized = normalize(visible);
      const pct = percentChange(visible);
      return {
        asset,
        color: COLORS[idx % COLORS.length],
        points: normalized,
        pct,
        first: visible[0],
        last: visible[visible.length - 1],
      };
    });
  }, [selected, assets, cpi, real, timeframe]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRefs = useRef<ISeriesApi<"Line">[]>([]);

  const { theme } = useTheme();
  const { t } = useI18n();

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
        minBarSpacing: 0.001,
      },
      crosshair: {
        vertLine: { color: p.crosshair, style: LineStyle.Dashed, width: 1, labelBackgroundColor: p.crosshair },
        horzLine: { color: p.crosshair, style: LineStyle.Dashed, width: 1, labelBackgroundColor: p.crosshair },
      },
    });
    chartRef.current = chart;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
    };
  }, []);

  // Re-apply chart palette on theme change. Series line colors are per-asset
  // and look fine on both backgrounds, so they stay.
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
    const chart = chartRef.current;
    if (!chart) return;
    // Drop old series
    for (const s of seriesRefs.current) chart.removeSeries(s);
    seriesRefs.current = [];
    let maxLength = 0;
    for (const r of rows) {
      if (r.points.length === 0) continue;
      const s = chart.addSeries(LineSeries, {
        color: r.color,
        lineWidth: 2,
        priceFormat: { type: "price", precision: 2, minMove: 0.01 },
        title: r.asset.shortName,
      });
      s.setData(r.points);
      seriesRefs.current.push(s);
      if (r.points.length > maxLength) maxLength = r.points.length;
    }
    if (maxLength >= 2) {
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: maxLength - 1 });
    }
  }, [rows]);

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({ mode: scale === "log" ? 1 : 0 });
  }, [scale]);

  const unselected = assets.filter((a) => !selected.includes(a.symbol));

  return (
    <div className="flex flex-col gap-5">
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
          <button
            onClick={() => updateQuery({ real: !real })}
            disabled={!cpi}
            className={`h-8 px-3 rounded-lg text-xs font-medium border transition ${
              real
                ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/40"
                : "bg-[var(--background-card)] text-[var(--foreground-muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {real ? t("chart.realToggle") : t("chart.nominalToggle")}
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[480px] w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-2"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {rows.map((r) => {
          const up = (r.pct ?? 0) >= 0;
          return (
            <button
              key={r.asset.symbol}
              onClick={() => toggleSymbol(r.asset.symbol)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-card)] hover:bg-[var(--background-hover)] transition text-left"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: r.color }}
              />
              <span className="text-sm font-medium flex-1 truncate">{r.asset.shortName}</span>
              {r.pct !== null && (
                <span
                  className={`text-xs font-mono tabular-nums ${up ? "text-[var(--up)]" : "text-[var(--down)]"}`}
                >
                  {formatPercent(r.pct)}
                </span>
              )}
              <span className="text-[10px] font-mono text-[var(--foreground-dim)]">✕</span>
            </button>
          );
        })}
      </div>

      {unselected.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {t("compare.add")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unselected.map((a) => (
              <button
                key={a.symbol}
                onClick={() => toggleSymbol(a.symbol)}
                className="h-7 px-2.5 rounded-md border border-[var(--border)] bg-[var(--background-card)] text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition"
              >
                + {a.shortName}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--foreground-dim)]">
        {t("compare.baselineNote", { date: rows[0]?.first?.t ?? "—" })}
      </p>
    </div>
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
