import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEdgeSessionFromRequest } from "@/lib/server/auth/session-edge";
import { applySecurityHeaders } from "@/lib/server/security-headers";

function redirectToAuth(request: NextRequest): NextResponse {
  const login = new URL("/auth", request.url);
  const returnPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  login.searchParams.set("redirect", returnPath);
  return NextResponse.redirect(login);
}

function jsonUnauthorized(): NextResponse {
  return NextResponse.json(
    { code: "unauthorized", message: "Unauthorized" },
    { status: 401 }
  );
}

function jsonForbidden(): NextResponse {
  return NextResponse.json(
    { code: "forbidden", message: "Forbidden" },
    { status: 403 }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const dest = new URL("/account", request.url);
    dest.hash = request.nextUrl.hash;
    request.nextUrl.searchParams.forEach((value, key) => {
      dest.searchParams.set(key, value);
    });
    return applySecurityHeaders(NextResponse.redirect(dest, 308), request);
  }

  const needsAuth =
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname.startsWith("/admin/");

  const needsAdminPage = pathname.startsWith("/admin/");
  const needsAdminApi = pathname.startsWith("/api/admin/");

  if (!needsAuth && !needsAdminApi) {
    return applySecurityHeaders(NextResponse.next(), request);
  }

  const session = await getEdgeSessionFromRequest(request);

  if (needsAdminApi) {
    if (!session) {
      return applySecurityHeaders(jsonUnauthorized(), request);
    }
    if (session.role !== "admin") {
      return applySecurityHeaders(jsonForbidden(), request);
    }
    return applySecurityHeaders(NextResponse.next(), request);
  }

  if (!session) {
    return applySecurityHeaders(redirectToAuth(request), request);
  }

  if (needsAdminPage && session.role !== "admin") {
    return applySecurityHeaders(NextResponse.redirect(new URL("/account", request.url)), request);
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/admin/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
