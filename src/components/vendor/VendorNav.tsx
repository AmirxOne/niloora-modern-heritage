"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagHappy, Category, LayoutDashboard, Receipt } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/vendor/dashboard", label: fa.vendor.navDashboard, icon: LayoutDashboard },
  { href: "/vendor/products", label: fa.vendor.navProducts, icon: Category },
  { href: "/vendor/orders", label: fa.vendor.navOrders, icon: BagHappy },
  { href: "/vendor/payouts", label: fa.vendor.navPayouts, icon: Receipt },
] as const;

export function VendorNav() {
  const pathname = usePathname();

  return (
    <aside
      className="overflow-x-auto border-b border-subtle pb-4 lg:sticky lg:top-[calc(var(--header-height)+1rem)] lg:border-b-0 lg:pb-0"
      aria-label="پیمایش فروشنده"
    >
      <nav className="flex min-w-max gap-2 lg:min-w-0 lg:flex-col lg:rounded-heritage lg:border lg:border-subtle lg:bg-matte-elevated lg:p-3 lg:shadow-[0_8px_22px_rgba(0,0,0,0.06)]">
        <p className="hidden px-2 pb-2 text-xs font-semibold tracking-wide text-silver lg:block">
          پنل فروشنده
        </p>
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-2 whitespace-nowrap rounded-heritage px-4 py-2.5 text-sm transition-colors lg:w-full",
                active
                  ? "bg-gold/10 font-semibold text-gold-dark ring-1 ring-gold/20"
                  : "text-silver hover:bg-matte hover:text-ivory"
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  active ? "text-gold-dark" : "text-silver/90 group-hover:text-ivory"
                )}
                aria-hidden
              />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
