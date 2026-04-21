import type { MetadataRoute } from "next";

const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://whattheindex.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // Nothing private on the site; the data JSONs under /data are also
        // fair game (Google occasionally surfaces them as "rich answers").
        allow: "/",
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
