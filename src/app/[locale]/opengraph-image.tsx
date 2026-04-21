import { ImageResponse } from "next/og";
import { isLocale, LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

// Site-wide fallback OG image. Applied to home, markets, compare, ratio,
// pp and methodology routes — any page that doesn't have its own
// opengraph-image.tsx. Kept deliberately simple.

// Runtime defaults to nodejs so generateStaticParams works (edge runtime
// forbids static param generation).
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "What the Index — markets without the noise";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const loc: Locale = isLocale(locale) ? locale : "en";
  const m = getMessages(loc);
  const title = m["home.title"];
  const subtitle = m["home.subtitle"];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(ellipse at top left, rgba(125, 211, 252, 0.12), transparent 60%), #0a0a0d",
          color: "#e8e8ea",
          fontFamily: "system-ui, sans-serif",
          padding: 72,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            color: "#a0a0a8",
            fontSize: 24,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#7dd3fc",
            }}
          />
          <span>What the Index</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.4,
              color: "#a0a0a8",
              maxWidth: 950,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#6a6a72",
            fontSize: 22,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <span>whattheindex.com</span>
          <span>{m["footer.data"].split(".")[0]}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
