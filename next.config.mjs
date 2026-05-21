import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

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
