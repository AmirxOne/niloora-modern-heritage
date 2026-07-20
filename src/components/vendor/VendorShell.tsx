"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { VendorNav } from "@/components/vendor/VendorNav";
import { isVendorPortalPath } from "@/lib/vendor/portal-paths";
import type { VendorProfileDto } from "@/lib/types/vendor";

export function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicStorefront = pathname.startsWith("/vendor/") && !isVendorPortalPath(pathname);

  if (isPublicStorefront) {
    return <div className="vendor-storefront pb-16 pt-6 md:pt-8">{children}</div>;
  }

  return (
    <div className="vendor-shell pb-24 pt-6 md:pt-8">
      <div className="site-container">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <VendorNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function useVendorProfile() {
  const pathname = usePathname();
  const [vendor, setVendor] = useState<VendorProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch("/api/vendor/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setVendor(data.vendor ?? null))
      .finally(() => setLoading(false));
  }, [pathname, reloadToken]);

  const reload = () => setReloadToken((t) => t + 1);

  return { vendor, loading, reload };
}

export function VendorPageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-display text-2xl text-ivory md:text-3xl">{title}</h1>
      {action}
    </div>
  );
}

export function VendorCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-heritage border border-subtle bg-matte-elevated p-5 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

export function VendorLinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center rounded-heritage bg-gold px-5 text-sm font-semibold text-white hover:bg-gold-dark"
    >
      {children}
    </Link>
  );
}
