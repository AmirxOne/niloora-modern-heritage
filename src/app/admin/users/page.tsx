import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminUsersPage() {
  const redirectTo = "/admin/users";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.users.title}
              subtitle={fa.admin.users.subtitle}
            />
            <AdminUsersPanel />
          </div>
      </AdminGuard>
  );
}
