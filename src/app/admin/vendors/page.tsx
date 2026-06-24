import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminVendorsPanel } from "@/components/admin/AdminVendorsPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminVendorsPage() {
  const redirectTo = "/admin/vendors";

  return (
    <AdminGuard redirectTo={redirectTo}>
      <div className="max-w-4xl">
        <AdminPageHeader title={fa.admin.vendors.title} subtitle={fa.admin.vendors.subtitle} />
        <AdminVendorsPanel />
      </div>
    </AdminGuard>
  );
}
