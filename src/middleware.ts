import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEdgeSessionFromRequest } from "@/lib/server/auth/session-edge";
import { applySecurityHeaders } from "@/lib/server/security-headers";
import { stripLocalePrefix } from "@/lib/i18n/locales";
import { canAccessContentWorkflow } from "@/lib/auth/content-workflow";

function redirectToAuth(request: NextRequest, prefix: string): NextResponse {
  const login = new URL(`${prefix}/auth`, request.url);
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
  const { locale, path } = stripLocalePrefix(pathname);
  const hasLocalePrefix = pathname !== path;
  const prefix = hasLocalePrefix ? `/${locale}` : "";

  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    const dest = new URL(`${prefix}/account`, request.url);
    dest.hash = request.nextUrl.hash;
    request.nextUrl.searchParams.forEach((value, key) => {
      dest.searchParams.set(key, value);
    });
    return applySecurityHeaders(NextResponse.redirect(dest, 308), request);
  }

  const needsAuth =
    path === "/account" ||
    path.startsWith("/account/") ||
    path.startsWith("/admin/");

  const needsPostsWorkflowPage = path === "/admin/posts" || path.startsWith("/admin/posts/");
  const needsAdminPage = path.startsWith("/admin/") && !needsPostsWorkflowPage;
  const needsAdminApi = path.startsWith("/api/admin/");
  const needsPostsWorkflowApi = path === "/api/admin/posts" || path.startsWith("/api/admin/posts/");

  if (!needsAuth && !needsAdminApi) {
    return applySecurityHeaders(NextResponse.next(), request);
  }

  const session = await getEdgeSessionFromRequest(request);

  if (needsAdminApi) {
    if (!session) {
      return applySecurityHeaders(jsonUnauthorized(), request);
    }
    if (needsPostsWorkflowApi) {
      if (!canAccessContentWorkflow(session.role)) {
        return applySecurityHeaders(jsonForbidden(), request);
      }
      return applySecurityHeaders(NextResponse.next(), request);
    }
    if (session.role !== "admin") {
      return applySecurityHeaders(jsonForbidden(), request);
    }
    return applySecurityHeaders(NextResponse.next(), request);
  }

  if (!session) {
    return applySecurityHeaders(redirectToAuth(request, prefix), request);
  }

  if (needsPostsWorkflowPage && !canAccessContentWorkflow(session.role)) {
    return applySecurityHeaders(NextResponse.redirect(new URL(`${prefix}/account`, request.url)), request);
  }

  if (needsAdminPage && session.role !== "admin") {
    return applySecurityHeaders(NextResponse.redirect(new URL(`${prefix}/account`, request.url)), request);
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
