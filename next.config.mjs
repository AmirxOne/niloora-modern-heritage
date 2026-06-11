import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    // Tree-shake large barrel packages so only used icons/motion utils ship.
    optimizePackageImports: ["iconsax-reactjs", "framer-motion"],
  },
  async redirects() {
    return [
      { source: "/login", destination: "/auth", permanent: true },
      { source: "/register", destination: "/auth", permanent: true },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1639, 1920],
    imageSizes: [64, 80, 96, 128, 256, 384],
    // Ready for an external image CDN/bucket; add hostnames here when used.
    remotePatterns: [],
  },
};

const hasSentryUpload = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  disableLogger: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableServerWebpackPlugin: !hasSentryUpload,
  disableClientWebpackPlugin: !hasSentryUpload,
  tunnelRoute: process.env.SENTRY_TUNNEL_ROUTE || "/monitoring",
});
