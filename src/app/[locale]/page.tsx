import Link from "next/link";
import { notFound } from "next/navigation";
import { ASSETS } from "@/data/assets";
import { loadAssetSparkline } from "@/lib/data-loader";
import { HomeHero } from "@/components/HomeHero";
import { HomePeriodSelector } from "@/components/HomePeriodSelector";
import { MoversStrip } from "@/components/MoversStrip";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { TIMEFRAMES, type Timeframe } from "@/lib/types";
import { format as formatMsg } from "@/i18n/messages";

// Shown front-and-center in the hero stats bar.
const HERO_SYMBOLS = ["sp500", "gold", "btc", "us10y"] as const;

function parseTf(raw: string | undefined): Timeframe {
  return raw && (TIMEFRAMES as readonly string[]).includes(raw)
    ? (raw as Timeframe)
    : "1Y";
}

function formatAsOf(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const tag = locale === "de" ? "de-DE" : locale === "ru" ? "ru-RU" : "en-US";
  return d.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const tfRaw = Array.isArray(sp.tf) ? sp.tf[0] : sp.tf;
  const timeframe = parseTf(tfRaw);
  const m = getMessages(locale as Locale);

  // Home only needs a ~200-point sparkline per asset for the Pulse cards
  // and Movers strip — load a timeframe-scoped thinned series to keep
  // the RSC payload small while keeping the percent-change numbers
  // honest for the selected window. Full series are loaded on the asset
  // detail pages only.
  const loaded = await Promise.all(
    ASSETS.map(async (asset) => ({
      asset,
      series: await loadAssetSparkline(asset.symbol, timeframe),
    })),
  );
  const available = loaded
    .filter((x) => x.series && x.series.points.length > 0)
    .map((x) => ({ asset: x.asset, points: x.series!.points }));

  const asOfIso =
    available
      .map((e) => e.points[e.points.length - 1]?.t ?? "")
      .sort()
      .pop() ?? "";
  const asOf = asOfIso ? formatAsOf(asOfIso, locale as Locale) : "";

  const heroEntries = HERO_SYMBOLS.map((sym) =>
    available.find((e) => e.asset.symbol === sym),
  ).filter(<T,>(x: T | undefined): x is T => x !== undefined);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10 flex flex-col gap-10">
      <section className="flex flex-col gap-5 max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {m["home.title"]}
        </h1>
        <p className="text-[var(--foreground-muted)] leading-relaxed">
          {m["home.subtitle"]}
        </p>
      </section>

      {/* Hero stats + period selector */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-[var(--foreground-dim)]">
            {m["home.pulse"]}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[11px] font-mono text-[var(--foreground-dim)] whitespace-nowrap">
              {asOf ? formatMsg(m["home.asOf"], { date: asOf }) : ""}
            </span>
            <HomePeriodSelector current={timeframe} label={m["home.period"]} />
          </div>
        </div>
        <HomeHero entries={heroEntries} timeframe={timeframe} locale={locale as Locale} />
      </section>

      {/* Movers */}
      <section>
        <MoversStrip
          entries={available}
          timeframe={timeframe}
          locale={locale as Locale}
          gainersLabel={m["home.movers.gainers"]}
          losersLabel={m["home.movers.losers"]}
          emptyLabel={m["home.movers.empty"]}
        />
      </section>

      {/* CTAs */}
      <section className="flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
        <Link
          href={localizedPath(locale, "/markets")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[var(--border-strong)] bg-[var(--background-card)] hover:bg-[var(--background-hover)] transition text-[var(--foreground)] text-sm font-medium"
        >
          {m["home.browseAll"]}
        </Link>
        <Link
          href={localizedPath(locale, "/compare")}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[var(--border)] bg-[var(--background-card)] hover:bg-[var(--background-hover)] transition text-[var(--foreground)] text-sm"
        >
          {m["home.compareCta"]}
        </Link>
        <span className="font-mono text-[var(--foreground-dim)]">
          {m["home.searchHint"].split("{kbd}")[0]}
          <kbd className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded border border-[var(--border-strong)] bg-[var(--background-card)] text-[10px]">
            /
          </kbd>
          {m["home.searchHint"].split("{kbd}")[1]}
        </span>
      </section>
    </div>
  );
}
