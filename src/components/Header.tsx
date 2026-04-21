"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitch } from "./LanguageSwitch";
import { useI18n } from "@/i18n/context";
import { localizedPath } from "@/i18n/config";

export function Header() {
  const { t, locale } = useI18n();
  const p = (path: string) => localizedPath(locale, path);
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background),transparent_20%)] backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-3">
        <Link href={p("/")} className="flex items-center gap-2 font-semibold tracking-tight shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" aria-hidden />
          <span className="hidden sm:inline">What the Index</span>
          <span className="sm:hidden">WTI</span>
        </Link>
        {/* Nav text + gaps shrink on mobile so the language switch and
            theme toggle don't overflow the right edge. Secondary items
            (Kaufkraft, Methodik) stay hidden on the smaller breakpoints
            and are reachable via the footer links. */}
        <nav className="flex items-center gap-2.5 sm:gap-4 text-[13px] sm:text-sm text-[var(--foreground-muted)]">
          <Link href={p("/markets")} className="hover:text-[var(--foreground)] transition">{t("nav.markets")}</Link>
          <Link href={p("/compare")} className="hover:text-[var(--foreground)] transition">{t("nav.compare")}</Link>
          <Link href={p("/ratio")} className="hover:text-[var(--foreground)] transition">{t("nav.ratio")}</Link>
          <Link href={p("/pp")} className="hover:text-[var(--foreground)] transition hidden md:inline">{t("nav.pp")}</Link>
          <Link href={p("/methodology")} className="hover:text-[var(--foreground)] transition hidden lg:inline">{t("nav.methodology")}</Link>
          <LanguageSwitch />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
