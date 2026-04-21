"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Asset, AssetCategory } from "@/data/assets";
import type { PricePoint, Timeframe } from "@/lib/types";
import { AssetCard } from "./AssetCard";
import { filterByTimeframe, percentChange } from "@/lib/timeframe";
import type { Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/context";

type Entry = { asset: Asset; points: PricePoint[] };

type Props = {
  entries: Entry[];
  timeframe: Timeframe;
  locale: Locale;
};

type SortKey = "nameAsc" | "changeDesc" | "changeAsc";

const CATEGORIES: readonly AssetCategory[] = [
  "index",
  "commodity",
  "crypto",
  "fx",
  "rates",
  "derived",
];

export function MarketsBrowser({ entries, timeframe, locale }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [sort, setSort] = useState<SortKey>("nameAsc");

  const enriched = useMemo(
    () =>
      entries.map((e) => ({
        ...e,
        change: percentChange(filterByTimeframe(e.points, timeframe)),
      })),
    [entries, timeframe],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = enriched.filter((e) => {
      if (category !== "all" && e.asset.category !== category) return false;
      if (!q) return true;
      return (
        e.asset.name.toLowerCase().includes(q) ||
        e.asset.shortName.toLowerCase().includes(q) ||
        e.asset.symbol.toLowerCase().includes(q)
      );
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sort === "nameAsc") return a.asset.shortName.localeCompare(b.asset.shortName);
      const ac = a.change ?? -Infinity;
      const bc = b.change ?? -Infinity;
      return sort === "changeDesc" ? bc - ac : ac - bc;
    });
    return sorted;
  }, [enriched, query, category, sort]);

  const countsByCategory = useMemo(() => {
    const out: Record<string, number> = { all: enriched.length };
    for (const c of CATEGORIES) out[c] = 0;
    for (const e of enriched) out[e.asset.category]++;
    return out;
  }, [enriched]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("markets.searchPlaceholder")}
            className="w-full h-10 rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 text-sm placeholder:text-[var(--foreground-dim)] focus:outline-none focus:border-[var(--border-strong)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            id="sort-label"
            className="text-xs font-mono uppercase tracking-wider text-[var(--foreground-dim)]"
          >
            {t("markets.sortLabel")}
          </label>
          <SortDropdown
            value={sort}
            onChange={setSort}
            labels={{
              nameAsc: t("markets.sort.nameAsc"),
              changeDesc: t("markets.sort.changeDesc"),
              changeAsc: t("markets.sort.changeAsc"),
            }}
          />
        </div>
      </div>

      <div
        role="tablist"
        aria-label={t("markets.filterAll")}
        className="flex flex-wrap gap-1.5"
      >
        <CategoryTab
          active={category === "all"}
          onClick={() => setCategory("all")}
          label={t("markets.filterAll")}
          count={countsByCategory.all}
        />
        {CATEGORIES.map((c) => (
          <CategoryTab
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={t(`category.${c}` as const)}
            count={countsByCategory[c]}
          />
        ))}
      </div>

      <div className="text-xs font-mono text-[var(--foreground-dim)]">
        {t("markets.resultCount")
          .replace("{count}", String(filtered.length))
          .replace("{total}", String(enriched.length))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">
          {t("markets.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(({ asset, points }) => (
            <AssetCard
              key={asset.symbol}
              asset={asset}
              points={points}
              locale={locale}
              timeframe={timeframe}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
  labels,
}: {
  value: SortKey;
  onChange: (v: SortKey) => void;
  labels: Record<SortKey, string>;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Mirror the LanguageSwitch dropdown behavior: click-outside and Escape
  // dismiss; the chevron rotates when the menu is open.
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

  const keys: SortKey[] = ["nameAsc", "changeDesc", "changeAsc"];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-labelledby="sort-label"
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--background-card)] text-sm text-[var(--foreground)] hover:border-[var(--border-strong)] transition"
      >
        <span>{labels[value]}</span>
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
          className={`transition ${open ? "rotate-180" : ""} text-[var(--foreground-muted)]`}
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 min-w-[180px] z-30 rounded-lg border border-[var(--border-strong)] bg-[var(--background-card)] shadow-lg overflow-hidden"
        >
          {keys.map((k) => {
            const active = k === value;
            return (
              <button
                key={k}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onChange(k);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 h-9 text-xs transition ${
                  active
                    ? "bg-[var(--background-hover)] text-[var(--foreground)]"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-hover)] hover:text-[var(--foreground)]"
                }`}
              >
                {labels[k]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition ${
        active
          ? "border-[var(--border-strong)] bg-[var(--background-hover)] text-[var(--foreground)]"
          : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      }`}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums text-[10px] text-[var(--foreground-dim)]">
        {count}
      </span>
    </button>
  );
}
