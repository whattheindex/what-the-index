"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Timeframe } from "@/lib/types";

const OPTIONS: Timeframe[] = ["1M", "3M", "6M", "1Y", "5Y", "10Y", "ALL"];

type Props = { current: Timeframe; label: string };

export function HomePeriodSelector({ current, label }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTf = (tf: Timeframe) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tf === "1Y") params.delete("tf");
    else params.set("tf", tf);
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-0.5"
    >
      {OPTIONS.map((t) => (
        <button
          key={t}
          onClick={() => setTf(t)}
          className={`px-2.5 h-8 text-xs font-medium tabular-nums rounded-md transition ${
            t === current
              ? "bg-[var(--background-hover)] text-[var(--foreground)]"
              : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
