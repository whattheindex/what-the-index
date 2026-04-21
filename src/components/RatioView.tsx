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
import type { AssetSeriesLite, Timeframe } from "@/lib/types";
import { TIMEFRAMES } from "@/lib/types";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { ratioSeries, stats } from "@/lib/align";
import { formatPercent } from "@/lib/format";
import { readChartPalette } from "@/lib/chart-theme";
import { useTheme } from "./ThemeProvider";
import { useI18n } from "@/i18n/context";

type Props = { assets: AssetSeriesLite[] };
type Scale = "linear" | "log";

const DEFAULTS = { num: "sp500", den: "gold", tf: "ALL" as Timeframe };

function formatRatio(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 2 : abs >= 0.1 ? 3 : 5;
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function RatioView({ assets }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const symbols = useMemo(() => assets.map((a) => a.symbol), [assets]);
  const qNum = searchParams.get("num");
  const qDen = searchParams.get("den");
  const num = qNum && symbols.includes(qNum) ? qNum : DEFAULTS.num;
  const den = qDen && symbols.includes(qDen) ? qDen : DEFAULTS.den;
  const timeframe = (TIMEFRAMES.includes(searchParams.get("tf") as Timeframe)
    ? searchParams.get("tf")
    : DEFAULTS.tf) as Timeframe;
  const scale: Scale = searchParams.get("scale") === "log" ? "log" : "linear";

  const updateQuery = useCallback(
    (patch: Partial<{ num: string; den: string; tf: Timeframe; scale: Scale }>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.num !== undefined) {
        if (patch.num === DEFAULTS.num) params.delete("num");
        else params.set("num", patch.num);
      }
      if (patch.den !== undefined) {
        if (patch.den === DEFAULTS.den) params.delete("den");
        else params.set("den", patch.den);
      }
      if (patch.tf !== undefined) {
        if (patch.tf === DEFAULTS.tf) params.delete("tf");
        else params.set("tf", patch.tf);
      }
      if (patch.scale !== undefined) {
        if (patch.scale === "linear") params.delete("scale");
        else params.set("scale", patch.scale);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const numAsset = assets.find((a) => a.symbol === num);
  const denAsset = assets.find((a) => a.symbol === den);

  const full = useMemo(
    () => (numAsset && denAsset ? ratioSeries(numAsset.points, denAsset.points) : []),
    [numAsset, denAsset],
  );
  const visible = useMemo(() => filterByTimeframe(full, timeframe), [full, timeframe]);
  const { current, min, max, percentile } = stats(visible);
  const pctChange = percentChange(visible);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

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
    const series = chart.addSeries(LineSeries, {
      color: p.accent,
      lineWidth: 2,
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
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
    series.applyOptions({ color: p.accent });
  }, [theme]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    const data: LineData[] = visible.map((p) => ({ time: p.t as Time, value: p.c }));
    series.setData(data);
    if (data.length >= 2) {
      chart.timeScale().setVisibleLogicalRange({ from: 0, to: data.length - 1 });
    }
  }, [visible]);

  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({ mode: scale === "log" ? 1 : 0 });
  }, [scale]);

  const swap = () => updateQuery({ num: den, den: num });
  const title =
    numAsset && denAsset
      ? t("ratio.in", { num: numAsset.name, den: denAsset.name })
      : "";
  const changeUp = (pctChange ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {t("ratio.numerator")}
          </label>
          <AssetSelect
            value={num}
            assets={assets}
            onChange={(v) => updateQuery({ num: v })}
          />
        </div>
        <button
          onClick={swap}
          title={t("ratio.swap")}
          className="h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-strong)] transition self-end"
        >
          ⇄
        </button>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {t("ratio.denominator")}
          </label>
          <AssetSelect
            value={den}
            assets={assets}
            onChange={(v) => updateQuery({ den: v })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="text-[var(--foreground-muted)] text-xs uppercase tracking-wider font-mono">
          {title}
        </div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatRatio(current)}
          </div>
          {pctChange !== null && (
            <div
              className={`text-base font-medium tabular-nums ${changeUp ? "text-[var(--up)]" : "text-[var(--down)]"}`}
            >
              {formatPercent(pctChange)}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          options={TIMEFRAMES.map((tf) => ({ value: tf, label: tf }))}
          value={timeframe}
          onChange={(v) => updateQuery({ tf: v as Timeframe })}
          label={t("chart.timeframe")}
        />
        <div className="ml-auto">
          <SegmentedControl
            options={[
              { value: "linear", label: t("chart.linear") },
              { value: "log", label: t("chart.log") },
            ]}
            value={scale}
            onChange={(v) => updateQuery({ scale: v as Scale })}
            label={t("chart.scale")}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[480px] w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-2"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label={t("ratio.statCurrent")} value={formatRatio(current)} />
        <Stat label={t("ratio.statLow")} value={formatRatio(min)} />
        <Stat label={t("ratio.statHigh")} value={formatRatio(max)} />
        <Stat
          label={t("ratio.statPercentile")}
          value={percentile !== null ? `${percentile.toFixed(0)}%` : "—"}
          hint={t("ratio.statPercentileHint")}
        />
      </div>

      <p className="text-xs text-[var(--foreground-dim)]">{t("ratio.note")}</p>
    </div>
  );
}

function AssetSelect({
  value,
  assets,
  onChange,
}: {
  value: string;
  assets: AssetSeriesLite[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition"
    >
      {assets.map((a) => (
        <option key={a.symbol} value={a.symbol}>
          {a.name}
        </option>
      ))}
    </select>
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

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2"
      title={hint}
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-dim)]">
        {label}
      </div>
      <div className="text-[var(--foreground)] font-medium mt-0.5 tabular-nums">
        {value}
      </div>
    </div>
  );
}
