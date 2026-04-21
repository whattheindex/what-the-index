import { NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE } from "./i18n/config";

// If the URL already starts with /en or /de, leave it alone.
// Otherwise internally rewrite to /en/<rest> — the visible URL stays
// prefix-less for the default locale.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocale) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Skip Next internals, static files with an extension, favicon, and the
    // JSON data files under /data.
    "/((?!_next/|api/|data/|favicon|.*\\..*).*)",
  ],
};
