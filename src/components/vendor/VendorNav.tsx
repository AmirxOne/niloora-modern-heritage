"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/vendor/dashboard", label: fa.vendor.navDashboard },
  { href: "/vendor/products", label: fa.vendor.navProducts },
  { href: "/vendor/orders", label: fa.vendor.navOrders },
  { href: "/vendor/payouts", label: fa.vendor.navPayouts },
  { href: "/account", label: fa.vendor.navAccount },
] as const;

export function VendorNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-subtle pb-4" aria-label="پیمایش فروشنده">
      {LINKS.map((link) => {
        const active =
          link.href === "/account"
            ? pathname.startsWith("/account")
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-heritage px-4 py-2 text-sm transition-colors",
              active
                ? "bg-gold/10 font-semibold text-gold-dark"
                : "text-silver hover:bg-matte-elevated hover:text-ivory"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
