"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ASSETS, type Asset } from "@/data/assets";
import { useI18n } from "@/i18n/context";
import { localizedPath } from "@/i18n/config";

function score(asset: Asset, q: string): number {
  if (!q) return 1;
  const needle = q.toLowerCase();
  const haystack = [asset.symbol, asset.name, asset.shortName, asset.category]
    .join(" ")
    .toLowerCase();
  if (!haystack.includes(needle)) return 0;
  if (asset.symbol.toLowerCase().startsWith(needle)) return 100;
  if (asset.name.toLowerCase().startsWith(needle)) return 90;
  if (asset.shortName.toLowerCase().startsWith(needle)) return 80;
  return 50;
}

export function CommandPalette() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    return ASSETS.map((a) => ({ asset: a, s: score(a, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 10)
      .map((x) => x.asset);
  }, [query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable);
      if (!open && !typing && e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen(true);
        setQuery("");
        return;
      }
      if (!open && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setQuery("");
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        const pick = results[active];
        if (pick) {
          e.preventDefault();
          setOpen(false);
          router.push(localizedPath(locale, `/a/${pick.symbol}`));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, router, locale]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div className="relative w-full max-w-lg rounded-xl border border-[var(--border-strong)] bg-[var(--background-card)] shadow-2xl shadow-black/40 overflow-hidden">
        <div className="flex items-center gap-2 px-4 h-12 border-b border-[var(--border)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[var(--foreground-muted)]">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("palette.placeholder")}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-[var(--foreground-dim)]"
          />
          <kbd className="text-[10px] font-mono text-[var(--foreground-dim)] border border-[var(--border)] rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>
        <ul className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && (
            <li className="px-4 py-4 text-sm text-[var(--foreground-dim)]">
              {t("palette.empty")}
            </li>
          )}
          {results.map((asset, i) => (
            <li key={asset.symbol}>
              <button
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  router.push(localizedPath(locale, `/a/${asset.symbol}`));
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition ${
                  active === i ? "bg-[var(--background-hover)]" : ""
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider font-mono text-[var(--foreground-dim)] w-16">
                  {t(`palette.category.${asset.category}` as const)}
                </span>
                <span className="flex-1 text-sm text-[var(--foreground)]">{asset.name}</span>
                <span className="text-xs font-mono text-[var(--foreground-muted)]">
                  {asset.symbol}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 px-4 h-8 border-t border-[var(--border)] text-[10px] font-mono text-[var(--foreground-dim)]">
          <span>
            <kbd className="inline-block mr-1 border border-[var(--border)] rounded px-1">↑↓</kbd>
            {t("palette.navigate")}
          </span>
          <span>
            <kbd className="inline-block mr-1 border border-[var(--border)] rounded px-1">↵</kbd>
            {t("palette.open")}
          </span>
        </div>
      </div>
    </div>
  );
}
