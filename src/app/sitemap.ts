import type { MetadataRoute } from "next";
import { ASSETS } from "@/data/assets";
import { LOCALES, DEFAULT_LOCALE, localizedPath } from "@/i18n/config";

// Every public page × every supported locale. Next.js turns this into
// /sitemap.xml at build time. We use env-driven base URL so dev/staging
// builds don't accidentally expose prod URLs.
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://whattheindex.com";

// Routes that exist once per locale (no dynamic segment).
const STATIC_ROUTES = ["/", "/markets", "/compare", "/ratio", "/pp", "/methodology"];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const locale of LOCALES) {
    for (const path of STATIC_ROUTES) {
      entries.push({
        url: `${BASE}${localizedPath(locale, path)}`,
        lastModified: now,
        // Home and markets are the highest-traffic landing pages.
        priority: path === "/" ? 1.0 : path === "/markets" ? 0.9 : 0.6,
        changeFrequency: path === "/markets" ? "daily" : "weekly",
      });
    }
    for (const asset of ASSETS) {
      entries.push({
        url: `${BASE}${localizedPath(locale, `/a/${asset.symbol}`)}`,
        lastModified: now,
        priority: 0.8,
        changeFrequency: "daily",
      });
    }
  }

  // Alternate-language <xhtml:link> annotations are emitted per-entry via
  // the `alternates` field. Next.js 14+ honors this in the generated XML.
  for (const entry of entries) {
    const relative = entry.url.replace(BASE, "");
    // Strip leading locale prefix (if present) to derive the shared path.
    const stripped = relative.replace(
      new RegExp(`^/(?:${LOCALES.filter((l) => l !== DEFAULT_LOCALE).join("|")})(?=/|$)`),
      "",
    );
    const cleanPath = stripped || "/";
    const languages: Record<string, string> = {};
    for (const l of LOCALES) {
      languages[l] = `${BASE}${localizedPath(l, cleanPath)}`;
    }
    entry.alternates = { languages };
  }

  return entries;
}
