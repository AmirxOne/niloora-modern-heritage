import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminHomeContentPanel } from "@/components/admin/AdminHomeContentPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";

export default function AdminHomePage() {
  const redirectTo = "/admin/home";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.home.title}</h1>
              <p className="admin-page-subtitle">{fa.admin.home.subtitle}</p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <AdminNavLinks />
            </header>
            <AdminHomeContentPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}

function AdminNavLinks() {
  const links = [
    { href: "/admin/orders", label: fa.admin.orders.navLabel },
    { href: "/admin/products", label: fa.admin.products.navLabel },
    { href: "/admin/promo-codes", label: fa.admin.promoCodes.navLabel },
    { href: "/admin/gift-cards", label: fa.admin.giftCards.navLabel },
    { href: "/admin/bundles", label: fa.admin.bundles.navLabel },
    { href: "/admin/trade-in", label: fa.admin.tradeIn.navLabel },
    { href: "/admin/support-requests", label: fa.admin.supportRequests.navLabel },
    { href: "/admin/back-in-stock-alerts", label: fa.admin.backInStockAlerts.navLabel },
    { href: "/admin/customizer-quotes", label: fa.customize.liveTimeline.admin.navLabel },
    { href: "/admin/media", label: "مدیریت رسانه" },
    { href: "/admin/audit-logs", label: "Audit Log" },
    { href: "/admin/posts", label: fa.admin.posts.navLabel },
    { href: "/admin/moderation", label: fa.admin.moderation.navLabel },
    { href: "/account", label: fa.admin.backToAccount },
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-turquoise-dark hover:text-turquoise"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
