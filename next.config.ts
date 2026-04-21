import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dynamic routes (locale home + markets) recompute 31 sparklines on every
  // render. Underlying data refreshes once a day, so let Cloudflare's edge
  // cache absorb the load: s-maxage=3600 + SWR means only one Worker hit
  // per PoP per hour, and stale responses keep serving while the next
  // revalidation runs in the background.
  async headers() {
    return [
      {
        source: "/:locale(en|de|ru)",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:locale(en|de|ru)/markets",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
