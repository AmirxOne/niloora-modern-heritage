"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { LastPathTracker } from "@/components/navigation/LastPathTracker";
import { stripLocalePrefix } from "@/lib/i18n/locales";
import { isVendorPortalPath } from "@/lib/vendor/portal-paths";
import { cn } from "@/lib/utils";

const AUTH_ROUTES = new Set(["/auth", "/login", "/register", "/forgot-password"]);

export function ConditionalLayoutChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalizedPath = pathname ? stripLocalePrefix(pathname).path : "/";
  const isAuthPage = AUTH_ROUTES.has(normalizedPath);
  const isAdminPanel = normalizedPath === "/admin" || normalizedPath.startsWith("/admin/");
  const isVendorPanel =
    normalizedPath === "/vendor" ||
    (normalizedPath.startsWith("/vendor/") && isVendorPortalPath(normalizedPath));
  const isBackofficePanel = isAdminPanel || isVendorPanel;

  const isHome = normalizedPath === "/";

  if (isAuthPage) {
    return <main className="h-[100dvh] overflow-hidden">{children}</main>;
  }

  if (isHome) {
    return (
      <>
        <Suspense fallback={null}>
          <LastPathTracker />
        </Suspense>
        <Header />
        <div className="pb-[var(--mobile-nav-height-safe)] pt-[var(--header-height)] lg:pb-0">
          {children}
        </div>
        <div className="hidden lg:block">
          <Footer />
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        <LastPathTracker />
      </Suspense>
      <Header />
      <div className="site-shell pt-[var(--header-height)] pb-[var(--mobile-nav-height-safe)] lg:pb-0">
        <main
          className={cn(
            isBackofficePanel
              ? "min-h-[calc(100dvh-var(--header-height))]"
              : "min-h-screen"
          )}
        >
          {children}
        </main>
      </div>
      {/* فوتر سنتی فقط در دسکتاپ نمایش داده می‌شود تا حس اپ موبایل حفظ شود */}
      {!isBackofficePanel ? (
        <div className="hidden lg:block">
          <Footer />
        </div>
      ) : null}
      <MobileBottomNav />
    </>
  );
}
