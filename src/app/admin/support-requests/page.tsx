import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSupportRequestsPanel } from "@/components/admin/AdminSupportRequestsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminSupportRequestsPage() {
  const redirectTo = "/admin/support-requests";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="admin-page">
        <div className="site-container">
          <header className="admin-page-header">
            <div>
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.supportRequests.title}</h1>
              <p className="admin-page-subtitle">{fa.admin.supportRequests.subtitle}</p>
              <nav className="admin-page-nav mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link href="/admin/orders" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.orders.navLabel}
                </Link>
                <Link href="/admin/trade-in" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.tradeIn.navLabel}
                </Link>
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/admin/back-in-stock-alerts" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backInStockAlerts.navLabel}
                </Link>
                <Link href="/admin/moderation" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.moderation.navLabel}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </nav>
            </div>
          </header>
          <AdminSupportRequestsPanel />
        </div>
      </div>
    </AdminGuard>
  );
}
