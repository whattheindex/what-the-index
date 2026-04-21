import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ASSETS } from "@/data/assets";
import { loadAsset, loadCpi } from "@/lib/data-loader";
import { CompareView } from "@/components/CompareView";
import type { AssetSeriesLite } from "@/lib/types";
import { isLocale, localizedPath, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale as Locale);
  return { title: `${m["compare.title"]} — What the Index` };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale as Locale);

  const [series, cpi] = await Promise.all([
    Promise.all(
      ASSETS.map(async (a): Promise<AssetSeriesLite | null> => {
        const s = await loadAsset(a.symbol);
        if (!s || s.points.length === 0) return null;
        return {
          symbol: a.symbol,
          name: a.name,
          shortName: a.shortName,
          category: a.category,
          currency: a.currency,
          unit: a.unit,
          points: s.points,
        };
      }),
    ),
    loadCpi(),
  ]);
  const available = series.filter((x): x is AssetSeriesLite => x !== null);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={localizedPath(locale, "/markets")}
          className="text-xs text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition w-fit"
        >
          {m["back.toMarkets"]}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">{m["compare.title"]}</h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl">
          {m["compare.description"].split("{one}")[0]}
          <span className="font-mono">100</span>
          {m["compare.description"].split("{one}")[1]}
        </p>
      </div>
      <Suspense>
        <CompareView assets={available} cpi={cpi} />
      </Suspense>
    </div>
  );
}
