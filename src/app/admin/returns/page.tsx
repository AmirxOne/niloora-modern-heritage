import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReturnsPanel } from "@/components/admin/AdminReturnsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminReturnsPage() {
  const redirectTo = "/admin/returns";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.returns.title}
              subtitle={fa.admin.returns.subtitle}
            />
            <AdminReturnsPanel />
          </div>
      </AdminGuard>
  );
}
