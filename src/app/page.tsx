import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/config";

// Visitors typing the bare domain land here. We redirect to the default
// locale so every page has a canonical /<locale>/... URL, no middleware
// rewrite required. Language-specific deep links (/de/markets, /ru/a/btc)
// are handled by the [locale] dynamic segment.
export default function RootRedirect() {
  redirect(`/${DEFAULT_LOCALE}`);
}
