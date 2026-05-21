import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Baseline security headers for HTML and API responses.
 * CSP is intentionally omitted to avoid breaking Next.js inline scripts in dev.
 */
export function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}
