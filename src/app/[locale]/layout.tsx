import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/i18n/context";
import { isLocale, LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import Link from "next/link";
import { Header } from "@/components/Header";
import { CommandPalette } from "@/components/CommandPalette";
import { Analytics } from "@/components/Analytics";
import { localizedPath, type Locale } from "@/i18n/config";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale);
  return {
    title: m["meta.title"],
    description: m["meta.description"],
  };
}

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <I18nProvider locale={locale}>
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <CommandPalette />
      <footer className="border-t border-[var(--border)] py-6 text-xs text-[var(--foreground-dim)]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Secondary nav lives here so Kaufkraft + Methodik stay
              reachable on viewports where the header hides them. */}
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-[var(--foreground-muted)]">
            <Link
              href={localizedPath(locale as Locale, "/markets")}
              className="hover:text-[var(--foreground)] transition"
            >
              {m["nav.markets"]}
            </Link>
            <Link
              href={localizedPath(locale as Locale, "/compare")}
              className="hover:text-[var(--foreground)] transition"
            >
              {m["nav.compare"]}
            </Link>
            <Link
              href={localizedPath(locale as Locale, "/ratio")}
              className="hover:text-[var(--foreground)] transition"
            >
              {m["nav.ratio"]}
            </Link>
            <Link
              href={localizedPath(locale as Locale, "/pp")}
              className="hover:text-[var(--foreground)] transition"
            >
              {m["nav.pp"]}
            </Link>
            <Link
              href={localizedPath(locale as Locale, "/methodology")}
              className="hover:text-[var(--foreground)] transition"
            >
              {m["nav.methodology"]}
            </Link>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="max-w-md">{m["footer.data"]}</span>
            <span className="font-mono">whattheindex.com</span>
          </div>
        </div>
      </footer>
      <Analytics />
    </I18nProvider>
  );
}
