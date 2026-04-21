import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCpi } from "@/lib/data-loader";
import { PurchasingPowerView } from "@/components/PurchasingPowerView";
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
  return { title: `${m["pp.title"]} — What the Index` };
}

export default async function PurchasingPowerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale as Locale);
  const cpi = await loadCpi();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          href={localizedPath(locale, "/markets")}
          className="text-xs text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition w-fit"
        >
          {m["back.toMarkets"]}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">{m["pp.title"]}</h1>
        <p className="text-sm text-[var(--foreground-muted)] max-w-2xl">
          {m["pp.description"]}
        </p>
      </div>
      {cpi ? (
        <Suspense>
          <PurchasingPowerView cpi={cpi} />
        </Suspense>
      ) : (
        <p className="text-sm text-[var(--foreground-muted)]">{m["pp.unavailable"]}</p>
      )}
    </div>
  );
}
