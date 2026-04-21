import Script from "next/script";

// Privacy-friendly analytics loader. Emits a <Script> tag only when the
// corresponding env var is set — so local dev and staging builds don't
// pollute production stats with their own page views.
//
// Pick one provider (or none). Both are GDPR-compliant and cookie-free:
//
//   Plausible: set NEXT_PUBLIC_PLAUSIBLE_DOMAIN=whattheindex.com
//              (optionally NEXT_PUBLIC_PLAUSIBLE_SRC for self-hosted)
//
//   Umami:     set NEXT_PUBLIC_UMAMI_ID=<website-id>
//              (optionally NEXT_PUBLIC_UMAMI_SRC for self-hosted)
//
// The <Script> strategy is `afterInteractive` so the page paints before
// the tracker fetches — matters for Core Web Vitals.
export function Analytics() {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? "https://plausible.io/js/script.js";

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_ID;
  const umamiSrc =
    process.env.NEXT_PUBLIC_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

  return (
    <>
      {plausibleDomain && (
        <Script
          id="plausible"
          src={plausibleSrc}
          data-domain={plausibleDomain}
          strategy="afterInteractive"
          defer
        />
      )}
      {umamiId && (
        <Script
          id="umami"
          src={umamiSrc}
          data-website-id={umamiId}
          strategy="afterInteractive"
          defer
        />
      )}
    </>
  );
}
