import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminMediaPagePanel } from "@/components/admin/AdminMediaPagePanel";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { fa } from "@/lib/i18n/fa";

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <AdminGuard redirectTo="/admin/media">
      <div className="max-w-6xl">
        <AdminPageHeader title={fa.admin.media.title} subtitle={fa.admin.media.subtitle} />
        <section className="admin-order-card">
          <AdminMediaPagePanel />
        </section>
      </div>
    </AdminGuard>
  );
}
