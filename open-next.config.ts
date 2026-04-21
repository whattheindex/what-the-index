import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal OpenNext config for Cloudflare Workers. The adapter transparently
// handles server components, middleware (our src/proxy.ts), on-demand
// rendering (Markets page's searchParams), and serves prebuilt static
// output for everything that generateStaticParams already prerendered.
//
// No cache wiring for now — we rely on Cloudflare's default edge cache +
// the SSG output Next.js produces at build time. We can layer KV or R2
// later if we want ISR-style revalidation.

export default defineCloudflareConfig({});
