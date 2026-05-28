import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { PageTransition } from "@/components/layout/PageTransition";
import { fa } from "@/lib/i18n/fa";

export default function AdminUsersPage() {
  const redirectTo = "/admin/users";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-4xl">
            <AdminPageHeader
              title={fa.admin.users.title}
              subtitle={fa.admin.users.subtitle}
            />
            <AdminUsersPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
