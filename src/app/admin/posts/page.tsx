import Link from "next/link";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPostsPanel } from "@/components/admin/AdminPostsPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { fa } from "@/lib/i18n/fa";

export default function AdminPostsPage() {
  return (
    <AdminGuard redirectTo="/admin/posts">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <header className="admin-page-header">
              <span className="heritage-eyebrow">{fa.admin.eyebrow}</span>
              <h1 className="admin-page-title">{fa.admin.posts.pageTitle}</h1>
              <p className="admin-page-subtitle">{fa.admin.posts.subtitle}</p>
              <OrnamentalDivider className="mx-auto my-5 max-w-[12rem]" />
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link href="/admin/home" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.home.navLabel}
                </Link>
                <Link href="/admin/orders" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.orders.navLabel}
                </Link>
                <Link
                  href="/admin/support-requests"
                  className="text-turquoise-dark hover:text-turquoise"
                >
                  {fa.admin.supportRequests.navLabel}
                </Link>
                <Link href="/blog" className="text-turquoise-dark hover:text-turquoise">
                  {fa.nav.blog}
                </Link>
                <Link href="/account" className="text-turquoise-dark hover:text-turquoise">
                  {fa.admin.backToAccount}
                </Link>
              </div>
            </header>
            <AdminPostsPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
