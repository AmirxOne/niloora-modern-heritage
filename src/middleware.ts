import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getEdgeSessionFromRequest, type EdgeSession } from "@/lib/server/auth/session-edge";
import type { SessionRole } from "@/lib/server/auth/session-constants";
import { applySecurityHeaders } from "@/lib/server/security-headers";
import { stripLocalePrefix } from "@/lib/i18n/locales";
import { canAccessContentWorkflow } from "@/lib/auth/content-workflow";
import { isVendorPortalPath } from "@/lib/vendor/portal-paths";

async function resolvePrivilegedSession(
  request: NextRequest,
  jwtSession: EdgeSession | null
): Promise<EdgeSession | null> {
  if (!jwtSession) return null;

  try {
    const roleUrl = new URL("/api/auth/session-role", request.url);
    const response = await fetch(roleUrl, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      cache: "no-store",
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { role?: SessionRole; blocked?: boolean };
    if (data.blocked) return null;

    const role = data.role;
    if (
      role !== "admin" &&
      role !== "editor" &&
      role !== "reviewer" &&
      role !== "user"
    ) {
      return null;
    }

    return { ...jwtSession, role };
  } catch {
    return null;
  }
}

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

const AUTH_PATH_PREFIXES = ["/auth", "/login", "/register", "/forgot-password"];

function isBlockedReturnPath(path: string): boolean {
  return AUTH_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function redirectAccessDenied(request: NextRequest, prefix: string, fallbackPath: string): NextResponse {
  const current = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refUrl = new URL(referer);
      const reqUrl = new URL(request.url);
      if (refUrl.origin === reqUrl.origin) {
        const path = `${refUrl.pathname}${refUrl.search}`;
        if (
          path !== current &&
          !isBlockedReturnPath(path) &&
          !path.startsWith("/admin") &&
          !path.startsWith(`${prefix}/admin`)
        ) {
          return NextResponse.redirect(new URL(path, request.url));
        }
      }
    } catch {
      // ignore invalid referer
    }
  }

  return NextResponse.redirect(new URL(`${prefix}${fallbackPath}`, request.url));
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
    path.startsWith("/admin/") ||
    (path.startsWith("/vendor/") && isVendorPortalPath(path));

  const needsPostsWorkflowPage = path === "/admin/posts" || path.startsWith("/admin/posts/");
  const needsAdminPage = path.startsWith("/admin/") && !needsPostsWorkflowPage;
  const needsAdminApi = path.startsWith("/api/admin/");
  const needsVendorApi = path.startsWith("/api/vendor/");
  const needsPostsWorkflowApi = path === "/api/admin/posts" || path.startsWith("/api/admin/posts/");

  if (!needsAuth && !needsAdminApi && !needsVendorApi) {
    return applySecurityHeaders(NextResponse.next(), request);
  }

  const jwtSession = await getEdgeSessionFromRequest(request);
  const needsDbRoleCheck =
    needsAdminApi || needsAdminPage || needsPostsWorkflowPage || needsPostsWorkflowApi;
  const session =
    jwtSession && needsDbRoleCheck
      ? await resolvePrivilegedSession(request, jwtSession)
      : jwtSession;

  if (needsVendorApi) {
    if (!jwtSession) {
      return applySecurityHeaders(jsonUnauthorized(), request);
    }
    return applySecurityHeaders(NextResponse.next(), request);
  }

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
    return applySecurityHeaders(redirectAccessDenied(request, prefix, "/account"), request);
  }

  if (needsAdminPage && session.role !== "admin") {
    return applySecurityHeaders(redirectAccessDenied(request, prefix, "/account"), request);
  }

  return applySecurityHeaders(NextResponse.next(), request);
}

export const config = {
  matcher: [
    "/account",
    "/account/:path*",
    "/admin/:path*",
    "/vendor/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/vendor/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
