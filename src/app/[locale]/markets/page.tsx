import { notFound } from "next/navigation";
import { ASSETS } from "@/data/assets";
import { loadPulse } from "@/lib/data-loader";
import { HomePeriodSelector } from "@/components/HomePeriodSelector";
import { MarketsBrowser } from "@/components/MarketsBrowser";
import { isLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { TIMEFRAMES, type Timeframe } from "@/lib/types";
import { format as formatMsg } from "@/i18n/messages";

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

export default async function MarketsPage({
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

  // Load the prebuilt timeframe bundle (one fetch, one parse). See the
  // note in src/lib/data-loader.ts — same prebuild the Home page uses.
  const pulse = (await loadPulse(timeframe)) ?? {};
  const available = ASSETS
    .map((asset) => ({ asset, points: pulse[asset.symbol]?.points ?? [] }))
    .filter((x) => x.points.length > 0);

  const asOfIso =
    available
      .map((e) => e.points[e.points.length - 1]?.t ?? "")
      .sort()
      .pop() ?? "";
  const asOf = asOfIso ? formatAsOf(asOfIso, locale as Locale) : "";

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10 flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {m["markets.title"]}
        </h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
          {m["markets.subtitle"]}
        </p>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-[11px] font-mono text-[var(--foreground-dim)] whitespace-nowrap">
          {asOf ? formatMsg(m["home.asOf"], { date: asOf }) : ""}
        </span>
        <HomePeriodSelector current={timeframe} label={m["home.period"]} />
      </section>

      <MarketsBrowser
        entries={available}
        timeframe={timeframe}
        locale={locale as Locale}
      />
    </div>
  );
}
