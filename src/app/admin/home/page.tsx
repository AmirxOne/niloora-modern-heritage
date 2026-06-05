import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminHomeContentPanel } from "@/components/admin/AdminHomeContentPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminHomePage() {
  const redirectTo = "/admin/home";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
            <AdminPageHeader
              title={fa.admin.home.title}
              subtitle={fa.admin.home.subtitle}
            />
            <AdminHomeContentPanel />
          </div>
      </AdminGuard>
  );
}
