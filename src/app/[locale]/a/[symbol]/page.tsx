import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ASSETS, getAsset } from "@/data/assets";
import { loadAsset, loadCpi } from "@/lib/data-loader";
import { AssetChart } from "@/components/AssetChart";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { isLocale, localizedPath, LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export async function generateStaticParams() {
  const out: { locale: string; symbol: string }[] = [];
  for (const locale of LOCALES) {
    for (const a of ASSETS) out.push({ locale, symbol: a.symbol });
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}) {
  const { locale, symbol } = await params;
  const asset = getAsset(symbol);
  if (!asset || !isLocale(locale)) return { title: "Not found" };
  return {
    title: `${asset.name} — What the Index`,
    description: asset.description[locale as Locale],
  };
}

export default async function AssetPage({
  params,
}: {
  params: Promise<{ locale: string; symbol: string }>;
}) {
  const { locale, symbol } = await params;
  if (!isLocale(locale)) notFound();
  const asset = getAsset(symbol);
  if (!asset) notFound();
  const series = await loadAsset(symbol);
  if (!series) notFound();
  const cpi = await loadCpi();
  const m = getMessages(locale as Locale);

  const granularity =
    series.points.length >= 5000
      ? m["asset.granularityDaily"]
      : series.points.length >= 1000
        ? m["asset.granularityMonthly"]
        : m["asset.granularityAnnual"];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link
          href={localizedPath(locale, "/markets")}
          className="text-xs text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition w-fit"
        >
          {m["back.toMarkets"]}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">{asset.name}</h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl">
          {asset.description[locale as Locale]}
        </p>
      </div>

      <ErrorBoundary
        fallback={
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-card)] p-8 flex flex-col gap-2 text-sm">
            <div className="font-semibold text-[var(--foreground)]">
              {m["chart.errorTitle"]}
            </div>
            <div className="text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
              {m["chart.errorBody"]}
            </div>
            <a
              href={`/data/${asset.symbol}.json`}
              className="text-[var(--accent)] hover:underline text-xs font-mono w-fit"
            >
              /data/{asset.symbol}.json →
            </a>
          </div>
        }
      >
        <Suspense>
          <AssetChart
            symbol={asset.symbol}
            name={asset.name}
            currency={asset.currency}
            unit={asset.unit}
            nominal={series.points}
            cpi={cpi}
            source={series.source}
          />
        </Suspense>
      </ErrorBoundary>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label={m["asset.category"]} value={asset.category} />
        <Stat label={m["asset.points"]} value={series.points.length.toLocaleString()} />
        <Stat label={m["asset.granularity"]} value={granularity} />
        <Stat label={m["asset.source"]} value={series.source} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--foreground-dim)]">
        {label}
      </div>
      <div className="text-[var(--foreground)] font-medium mt-0.5 capitalize truncate">
        {value}
      </div>
    </div>
  );
}
