import Link from "next/link";
import type { Asset } from "@/data/assets";
import type { PricePoint, Timeframe } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { formatPrice, formatPercent } from "@/lib/format";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import { localizedPath, type Locale } from "@/i18n/config";

type Props = {
  asset: Asset;
  points: PricePoint[];
  locale: Locale;
  timeframe?: Timeframe;
};

export function AssetCard({ asset, points, locale, timeframe = "1Y" }: Props) {
  const latest = points[points.length - 1];
  const windowPts = filterByTimeframe(points, timeframe);
  const change = percentChange(windowPts);
  const up = (change ?? 0) >= 0;

  return (
    <Link
      href={localizedPath(locale, `/a/${asset.symbol}`)}
      className="group flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--background-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-dim)]">
            {asset.category}
          </div>
          <div className="text-base font-semibold tracking-tight mt-0.5">
            {asset.shortName}
          </div>
        </div>
        {change !== null && (
          <div
            className={`text-sm font-medium tabular-nums mt-1 ${up ? "text-[var(--up)]" : "text-[var(--down)]"}`}
          >
            {formatPercent(change)}
          </div>
        )}
      </div>

      <div className="-mx-1">
        <Sparkline points={windowPts} up={up} width={320} height={44} />
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-lg font-semibold tabular-nums">
          {latest ? formatPrice(latest.c, asset.currency, asset.unit) : "—"}
        </div>
        <div className="text-[10px] text-[var(--foreground-dim)] font-mono">{timeframe}</div>
      </div>
    </Link>
  );
}
