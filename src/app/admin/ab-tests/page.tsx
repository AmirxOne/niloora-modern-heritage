import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminAbTestsPanel } from "@/components/admin/AdminAbTestsPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default function AdminAbTestsPage() {
  return (
    <AdminGuard redirectTo="/admin/ab-tests">
      <div className="max-w-6xl">
        <AdminPageHeader title={fa.admin.abTests.title} subtitle={fa.admin.abTests.subtitle} />
        <AdminAbTestsPanel />
      </div>
    </AdminGuard>
  );
}
