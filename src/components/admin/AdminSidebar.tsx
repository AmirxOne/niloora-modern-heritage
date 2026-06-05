"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavIconById } from "@/components/admin/adminNavIcons";
import { getAdminNavItemsForRole, isAdminNavActive } from "@/lib/admin/navigation";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";

export function AdminSidebar() {
  const pathname = usePathname();
  const { auth } = useApp();
  const items = getAdminNavItemsForRole(auth.user?.role);

  if (items.length === 0) return null;

  return (
    <aside className="admin-shell-sidebar" aria-label={fa.admin.sidebarLabel}>
      <div className="admin-sidebar-card">
        <p className="admin-sidebar-eyebrow">{fa.admin.eyebrow}</p>
        <nav>
          <ul className="admin-nav-list">
            {items.map((item) => {
              const active = isAdminNavActive(item.href, pathname);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("admin-nav-item", active && "admin-nav-item--active")}
                  >
                    <span className="admin-nav-item-icon">{adminNavIconById[item.id] ?? null}</span>
                    <span className="flex-1 text-start">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <Link href="/account" className="admin-sidebar-back-link">
          {fa.admin.backToAccount}
        </Link>
      </div>
    </aside>
  );
}
