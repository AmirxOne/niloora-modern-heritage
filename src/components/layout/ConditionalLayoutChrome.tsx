"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
      <div className="site-shell pt-[var(--header-height)]">
        <main className="min-h-screen">{children}</main>
      </div>
      <Footer />
    </>
  );
}
