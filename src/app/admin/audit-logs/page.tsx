import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminAuditLogPanel } from "@/components/admin/AdminAuditLogPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageTransition } from "@/components/layout/PageTransition";

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard redirectTo="/admin/audit-logs">
      <PageTransition>
        <div className="pb-24 pt-6 md:pt-8">
          <div className="site-container max-w-6xl">
            <AdminPageHeader
              title="Audit Log"
              subtitle="ثبت کامل تغییرات مهم ادمین: چه کسی، چه زمانی، چه چیزی را تغییر داده است."
            />
            <AdminAuditLogPanel />
          </div>
        </div>
      </PageTransition>
    </AdminGuard>
  );
}
