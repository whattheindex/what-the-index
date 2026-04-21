export function formatPrice(n: number, currency?: string, unit?: string): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const digits = abs >= 1000 ? 0 : abs >= 10 ? 2 : 4;
  const formatted = n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (unit === "%") return `${formatted}%`;
  if (unit) return `${formatted} ${unit}`;
  if (currency === "USD") return `$${formatted}`;
  if (currency === "EUR") return `€${formatted}`;
  if (currency === "GBP") return `£${formatted}`;
  if (currency === "JPY") return `¥${formatted}`;
  if (currency === "CHF") return `${formatted} CHF`;
  if (currency === "CNY") return `¥${formatted}`;
  if (currency) return `${formatted} ${currency}`;
  return formatted;
}

export function formatPercent(pct: number): string {
  if (!Number.isFinite(pct)) return "—";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCompactDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}
