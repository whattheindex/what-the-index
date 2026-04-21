export const LOCALES = ["en", "de", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(x: string): x is Locale {
  return (LOCALES as readonly string[]).includes(x);
}

// Prefix the given pathname with the locale. Every locale — including the
// default — carries a visible `/<locale>` segment, which keeps the routing
// fully static and avoids a server-side proxy rewrite (Next.js 16 + the
// Cloudflare Workers adapter don't currently agree on middleware runtime).
// The root `app/page.tsx` redirects `/` to `/${DEFAULT_LOCALE}` so visitors
// typing the bare domain still land on the right page.
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean === "/" ? "" : clean}`;
}

// Strip any leading locale prefix, returning the "neutral" path. Used by
// the language switch to compute the equivalent URL in another locale.
export function stripLocale(path: string): string {
  for (const l of LOCALES) {
    if (path === `/${l}`) return "/";
    if (path.startsWith(`/${l}/`)) return path.slice(l.length + 1);
  }
  return path;
}
