import { canAccessContentWorkflow } from "@/lib/auth/content-workflow";
import { fa } from "@/lib/i18n/fa";

export type AdminNavAccess = "admin" | "content-workflow";

export type AdminNavItemDef = {
  id: string;
  href: string;
  label: string;
  access: AdminNavAccess;
  /** Legacy `/account#...` section id for redirects */
  legacyHash?: string;
};

export const ADMIN_NAV_ITEMS: AdminNavItemDef[] = [
  { id: "users", href: "/admin/users", label: fa.admin.users.navLabel, access: "admin" },
  { id: "finance", href: "/admin/finance", label: fa.admin.finance.navLabel, access: "admin" },
  {
    id: "orders",
    href: "/admin/orders",
    label: fa.admin.orders.navLabel,
    access: "admin",
    legacyHash: "admin-orders",
  },
  { id: "returns", href: "/admin/returns", label: fa.admin.returns.navLabel, access: "admin" },
  {
    id: "products",
    href: "/admin/products",
    label: fa.admin.products.navLabel,
    access: "admin",
    legacyHash: "admin-products",
  },
  {
    id: "trade-in",
    href: "/admin/trade-in",
    label: fa.admin.tradeIn.navLabel,
    access: "admin",
    legacyHash: "admin-trade-in",
  },
  {
    id: "support-requests",
    href: "/admin/support-requests",
    label: fa.admin.supportRequests.navLabel,
    access: "admin",
  },
  {
    id: "promo-codes",
    href: "/admin/promo-codes",
    label: fa.admin.promoCodes.navLabel,
    access: "admin",
    legacyHash: "admin-promo-codes",
  },
  { id: "campaigns", href: "/admin/campaigns", label: fa.admin.campaigns.navLabel, access: "admin" },
  { id: "bundles", href: "/admin/bundles", label: fa.admin.bundles.navLabel, access: "admin" },
  {
    id: "gift-cards",
    href: "/admin/gift-cards",
    label: fa.admin.giftCards.navLabel,
    access: "admin",
    legacyHash: "admin-gift-cards",
  },
  {
    id: "customizer-quotes",
    href: "/admin/customizer-quotes",
    label: fa.admin.customizerQuotes.navLabel,
    access: "admin",
    legacyHash: "admin-customizer-quotes",
  },
  {
    id: "home",
    href: "/admin/home",
    label: fa.admin.home.navLabel,
    access: "admin",
    legacyHash: "admin-home",
  },
  {
    id: "ab-tests",
    href: "/admin/ab-tests",
    label: fa.admin.abTests.navLabel,
    access: "admin",
  },
  {
    id: "posts",
    href: "/admin/posts",
    label: fa.admin.posts.navLabel,
    access: "content-workflow",
    legacyHash: "admin-posts",
  },
  {
    id: "moderation",
    href: "/admin/moderation",
    label: fa.admin.moderation.navLabel,
    access: "admin",
    legacyHash: "admin-moderation",
  },
  {
    id: "ring-customization",
    href: "/admin/ring-customization",
    label: fa.admin.ringCustomization.navLabel,
    access: "admin",
  },
  {
    id: "back-in-stock-alerts",
    href: "/admin/back-in-stock-alerts",
    label: fa.admin.backInStockAlerts.navLabel,
    access: "admin",
  },
  { id: "media", href: "/admin/media", label: fa.admin.media.navLabel, access: "admin" },
  { id: "audit-logs", href: "/admin/audit-logs", label: fa.admin.auditLogs.navLabel, access: "admin" },
  { id: "settings", href: "/admin/settings", label: fa.admin.settings.navLabel, access: "admin" },
];

const LEGACY_ADMIN_HASH_REDIRECTS: Record<string, string> = Object.fromEntries(
  ADMIN_NAV_ITEMS.filter((item) => item.legacyHash).map((item) => [item.legacyHash!, item.href])
);

export function canAccessAdminNavItem(access: AdminNavAccess, role?: string | null): boolean {
  if (access === "admin") return role === "admin";
  return canAccessContentWorkflow(role ?? undefined);
}

export function getAdminNavItemsForRole(role?: string | null): AdminNavItemDef[] {
  return ADMIN_NAV_ITEMS.filter((item) => canAccessAdminNavItem(item.access, role));
}

export function canAccessAdminArea(role?: string | null): boolean {
  return getAdminNavItemsForRole(role).length > 0;
}

export function resolveLegacyAdminRedirect(
  hash: string,
  sectionQuery: string | null
): string | null {
  const fromQuery = sectionQuery?.trim();
  if (fromQuery && fromQuery in LEGACY_ADMIN_HASH_REDIRECTS) {
    return LEGACY_ADMIN_HASH_REDIRECTS[fromQuery];
  }

  const normalized = hash.replace(/^#/, "").trim();
  if (!normalized) return null;
  return LEGACY_ADMIN_HASH_REDIRECTS[normalized] ?? null;
}

export function isAdminNavActive(itemHref: string, pathname: string): boolean {
  if (pathname === itemHref) return true;
  return pathname.startsWith(`${itemHref}/`);
}
