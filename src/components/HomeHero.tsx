import Link from "next/link";
import type { Asset } from "@/data/assets";
import type { PricePoint, Timeframe } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { formatPrice, formatPercent } from "@/lib/format";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { localizedPath, type Locale } from "@/i18n/config";

type Entry = { asset: Asset; points: PricePoint[] };

type Props = {
  entries: Entry[];
  timeframe: Timeframe;
  locale: Locale;
};

export function HomeHero({ entries, timeframe, locale }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {entries.map(({ asset, points }) => {
        const windowPts = filterByTimeframe(points, timeframe);
        const change = percentChange(windowPts);
        const up = (change ?? 0) >= 0;
        const latest = points[points.length - 1];
        return (
          <Link
            key={asset.symbol}
            href={localizedPath(locale, `/a/${asset.symbol}`)}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--background-hover)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-tight">{asset.shortName}</span>
              {change !== null && (
                <span
                  className={`text-xs font-mono tabular-nums ${up ? "text-[var(--up)]" : "text-[var(--down)]"}`}
                >
                  {formatPercent(change)}
                </span>
              )}
            </div>
            <div className="-mx-1 h-9">
              <Sparkline points={windowPts} up={up} width={320} height={36} />
            </div>
            <div className="text-xl font-semibold tabular-nums leading-none">
              {latest ? formatPrice(latest.c, asset.currency, asset.unit) : "—"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
