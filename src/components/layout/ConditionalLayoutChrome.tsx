"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const AUTH_ROUTES = new Set(["/auth", "/login", "/register", "/forgot-password"]);

export function ConditionalLayoutChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname ? AUTH_ROUTES.has(pathname) : false;

  if (isAuthPage) {
    return <main className="h-[100dvh] overflow-hidden">{children}</main>;
  }

  return (
    <>
      <Header />
      <div className="site-shell pt-[var(--header-height)] pb-[var(--mobile-nav-height-safe)] lg:pb-0">
        <main className="min-h-screen">{children}</main>
      </div>
      {/* فوتر سنتی فقط در دسکتاپ نمایش داده می‌شود تا حس اپ موبایل حفظ شود */}
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </>
  );
}
