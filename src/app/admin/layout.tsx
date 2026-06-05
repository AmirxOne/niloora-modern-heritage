import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PageTransition } from "@/components/layout/PageTransition";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="admin-page pb-24 pt-6 md:pt-8">
        <div className="site-container">
          <div className="admin-shell">
            <AdminSidebar />
            <main className="admin-shell-main">{children}</main>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
