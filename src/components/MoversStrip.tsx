import Link from "next/link";
import type { Asset } from "@/data/assets";
import type { PricePoint, Timeframe } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { formatPrice, formatPercent } from "@/lib/format";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { localizedPath, type Locale } from "@/i18n/config";

type Entry = { asset: Asset; points: PricePoint[] };
type Ranked = Entry & { change: number };

type Props = {
  entries: Entry[];
  timeframe: Timeframe;
  locale: Locale;
  gainersLabel: string;
  losersLabel: string;
  emptyLabel: string;
};

export function MoversStrip({
  entries,
  timeframe,
  locale,
  gainersLabel,
  losersLabel,
  emptyLabel,
}: Props) {
  // Rates assets are index-like and can dominate the movers list in any
  // direction; we keep them in but could exclude later. Exclude entries with
  // fewer than two points in the selected window so % change is meaningful.
  const ranked: Ranked[] = entries
    .map((e): Ranked | null => {
      const win = filterByTimeframe(e.points, timeframe);
      const pct = percentChange(win);
      if (pct === null) return null;
      return { ...e, change: pct };
    })
    .filter((x): x is Ranked => x !== null);

  const gainers = [...ranked].sort((a, b) => b.change - a.change).slice(0, 3);
  const losers = [...ranked].sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <MoverList
        title={gainersLabel}
        rows={gainers}
        timeframe={timeframe}
        locale={locale}
        tone="up"
        emptyLabel={emptyLabel}
      />
      <MoverList
        title={losersLabel}
        rows={losers}
        timeframe={timeframe}
        locale={locale}
        tone="down"
        emptyLabel={emptyLabel}
      />
    </div>
  );
}

function MoverList({
  title,
  rows,
  timeframe,
  locale,
  tone,
  emptyLabel,
}: {
  title: string;
  rows: Ranked[];
  timeframe: Timeframe;
  locale: Locale;
  tone: "up" | "down";
  emptyLabel: string;
}) {
  const color = tone === "up" ? "var(--up)" : "var(--down)";
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-3">
      <div className="flex items-center gap-2 px-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} aria-hidden />
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
          {title}
        </span>
        <span className="ml-auto text-[10px] font-mono text-[var(--foreground-dim)]">{timeframe}</span>
      </div>
      <ul className="flex flex-col">
        {rows.length === 0 && (
          <li className="px-1 py-2 text-xs text-[var(--foreground-dim)]">{emptyLabel}</li>
        )}
        {rows.map((r) => {
          const win = filterByTimeframe(r.points, timeframe);
          const latest = r.points[r.points.length - 1];
          const isUp = r.change >= 0;
          return (
            <li key={r.asset.symbol}>
              <Link
                href={localizedPath(locale, `/a/${r.asset.symbol}`)}
                className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-[var(--background-hover)] transition"
              >
                <span className="text-sm font-medium min-w-0 truncate flex-1">
                  {r.asset.shortName}
                </span>
                <span className="hidden sm:block opacity-80">
                  <Sparkline points={win} up={isUp} width={80} height={22} />
                </span>
                <span className="text-xs text-[var(--foreground-muted)] tabular-nums hidden sm:inline">
                  {latest ? formatPrice(latest.c, r.asset.currency, r.asset.unit) : "—"}
                </span>
                <span
                  className={`text-sm font-mono tabular-nums font-medium w-20 text-right`}
                  style={{ color: isUp ? "var(--up)" : "var(--down)" }}
                >
                  {formatPercent(r.change)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
