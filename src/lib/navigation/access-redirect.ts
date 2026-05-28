import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const LAST_PATH_STORAGE_KEY = "niloora:lastPath";

const BLOCKED_PREFIXES = ["/auth", "/login", "/register", "/forgot-password"];

function isBlockedPath(path: string): boolean {
  return BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function isSafeReturnPath(path: string, currentPath: string): boolean {
  if (!path.startsWith("/")) return false;
  if (isBlockedPath(path)) return false;
  if (path === currentPath) return false;
  return true;
}

export function rememberAppPath(path: string): void {
  if (typeof window === "undefined") return;
  if (isBlockedPath(path)) return;
  sessionStorage.setItem(LAST_PATH_STORAGE_KEY, path);
}

export function resolveAccessRedirect(fallback: string): string | "__back__" {
  if (typeof window === "undefined") return fallback;

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  const stored = sessionStorage.getItem(LAST_PATH_STORAGE_KEY);
  if (stored && isSafeReturnPath(stored, current)) return stored;

  try {
    const referrer = document.referrer;
    if (referrer) {
      const refUrl = new URL(referrer);
      if (refUrl.origin === window.location.origin) {
        const path = `${refUrl.pathname}${refUrl.search}${refUrl.hash}`;
        if (isSafeReturnPath(path, current)) return path;
      }
    }
  } catch {
    // ignore invalid referrer
  }

  if (window.history.length > 1) return "__back__";

  return fallback;
}

export function performAccessRedirect(router: AppRouterInstance, fallback: string): void {
  const target = resolveAccessRedirect(fallback);
  if (target === "__back__") {
    router.back();
    return;
  }
  router.replace(target);
}
