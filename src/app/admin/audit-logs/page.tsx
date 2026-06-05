import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminAuditLogPanel } from "@/components/admin/AdminAuditLogPanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export default function AdminAuditLogsPage() {
  return (
    <AdminGuard redirectTo="/admin/audit-logs">
      <div className="max-w-6xl">
        <AdminPageHeader
          title={fa.admin.auditLogs.title}
          subtitle={fa.admin.auditLogs.subtitle}
        />
        <AdminAuditLogPanel />
      </div>
    </AdminGuard>
  );
}
