"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/context";
import { LOCALES, stripLocale, localizedPath, type Locale } from "@/i18n/config";

// Native name of each locale for the menu items. Keeping it in this file
// (instead of messages.ts) because these strings are always shown in
// their own language, never translated — "Deutsch" should read as
// "Deutsch" to an English visitor too.
const NATIVE_NAME: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export function LanguageSwitch() {
  const { locale } = useI18n();
  const pathname = usePathname() ?? "/";
  const basePath = stripLocale(pathname);

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside-click or Escape. Same pattern as the Export menu on
  // the chart — reuse the mental model so users aren't surprised.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 h-8 px-2 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-[11px] font-mono uppercase tracking-wider text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
      >
        <span>{locale}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`transition ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[160px] z-30 rounded-lg border border-[var(--border-strong)] bg-[var(--background-card)] shadow-lg overflow-hidden"
        >
          {LOCALES.map((l: Locale) => {
            const active = l === locale;
            return (
              <Link
                key={l}
                href={localizedPath(l, basePath)}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-3 h-9 text-xs transition ${
                  active
                    ? "bg-[var(--background-hover)] text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{NATIVE_NAME[l]}</span>
                <span className="font-mono uppercase tracking-wider text-[10px] text-[var(--foreground-dim)]">
                  {l}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
