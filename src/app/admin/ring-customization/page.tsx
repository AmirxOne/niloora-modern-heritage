import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminRingCustomizationPanel } from "@/components/admin/AdminRingCustomizationPanel";
import { fa } from "@/lib/i18n/fa";

export default function AdminRingCustomizationPage() {
  return (
    <AdminGuard redirectTo="/admin/ring-customization">
      <div className="max-w-5xl">
        <AdminPageHeader
          title={fa.admin.ringCustomization.title}
          subtitle={fa.admin.ringCustomization.subtitle}
        />
        <AdminRingCustomizationPanel />
      </div>
    </AdminGuard>
  );
}

