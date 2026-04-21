"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CpiSeries } from "@/lib/types";
import { useI18n } from "@/i18n/context";

type Props = { cpi: CpiSeries };

const DEFAULTS = { amount: 100, year: 1980 };

export function PurchasingPowerView({ cpi }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();
  const numberLocale = locale === "de" ? "de-DE" : "en-US";

  const years = useMemo(() => {
    const ys = new Set<number>();
    for (const p of cpi.points) ys.add(Number(p.t.slice(0, 4)));
    return Array.from(ys).sort((a, b) => a - b);
  }, [cpi]);
  const minYear = years[0];
  const maxYear = years[years.length - 1];

  const rawAmount = Number(searchParams.get("a"));
  const amount = Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : DEFAULTS.amount;
  const rawYear = Number(searchParams.get("y"));
  const year = Number.isFinite(rawYear) && rawYear >= minYear && rawYear <= maxYear
    ? Math.round(rawYear)
    : DEFAULTS.year;

  const update = useCallback(
    (patch: { a?: number; y?: number }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (patch.a !== undefined) {
        if (patch.a === DEFAULTS.amount) params.delete("a");
        else params.set("a", String(patch.a));
      }
      if (patch.y !== undefined) {
        if (patch.y === DEFAULTS.year) params.delete("y");
        else params.set("y", String(patch.y));
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  // Average CPI for the chosen year (mean across all monthly obs in that year).
  const yearlyAvg = useMemo(() => {
    const byYear = new Map<number, { sum: number; count: number }>();
    for (const p of cpi.points) {
      const y = Number(p.t.slice(0, 4));
      const e = byYear.get(y) ?? { sum: 0, count: 0 };
      e.sum += p.v;
      e.count += 1;
      byYear.set(y, e);
    }
    const out = new Map<number, number>();
    for (const [y, { sum, count }] of byYear) out.set(y, sum / count);
    return out;
  }, [cpi]);

  const cpiStart = yearlyAvg.get(year)!;
  const cpiNow = cpi.points[cpi.points.length - 1].v;
  const todayValue = (amount * cpiNow) / cpiStart;
  const factor = cpiNow / cpiStart;
  const annualized = Math.pow(factor, 1 / Math.max(1, new Date().getFullYear() - year)) - 1;

  const markerYears = [1950, 1970, 1980, 1990, 2000, 2010, 2020].filter(
    (y) => y >= minYear && y <= maxYear,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {t("pp.amount")}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xl text-[var(--foreground-muted)] font-mono">$</span>
            <input
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v > 0) update({ a: v });
              }}
              className="flex-1 h-12 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-2xl font-semibold tabular-nums focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>
        </div>
        <div className="text-[var(--foreground-muted)] text-lg text-center md:pb-3 md:px-2">{t("pp.in")}</div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {t("pp.year")}
          </label>
          <input
            type="number"
            min={minYear}
            max={maxYear}
            step={1}
            value={year}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) update({ y: Math.max(minYear, Math.min(maxYear, Math.round(v))) });
            }}
            className="h-12 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-2xl font-semibold tabular-nums focus:outline-none focus:border-[var(--accent)] transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {markerYears.map((y) => (
          <button
            key={y}
            onClick={() => update({ y })}
            className={`h-7 px-2.5 rounded-md border text-xs tabular-nums transition ${
              year === y
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 sm:p-8 flex flex-col gap-3">
        <div className="text-sm text-[var(--foreground-muted)]">
          {t("pp.resultLine", {
            amount: `$${amount.toLocaleString(numberLocale)}`,
            year: String(year),
          })}
        </div>
        <div className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums">
          {todayValue.toLocaleString(numberLocale, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          })}
        </div>
        <div className="text-sm text-[var(--foreground-muted)]">{t("pp.today")}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <Stat
          label={t("pp.totalInflation")}
          value={`${((factor - 1) * 100).toFixed(1)}%`}
        />
        <Stat
          label={t("pp.cpiMultiplier")}
          value={`${factor.toFixed(2)}×`}
          hint={t("pp.cpiMultiplierHint")}
        />
        <Stat
          label={t("pp.avgAnnual")}
          value={`${(annualized * 100).toFixed(2)}%`}
        />
      </div>

      <p className="text-xs text-[var(--foreground-dim)]">{t("pp.footnote")}</p>
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
