"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VendorApplyForm } from "@/components/vendor/VendorApplyForm";
import { VendorPageHeader, useVendorProfile } from "@/components/vendor/VendorShell";
import { fa } from "@/lib/i18n/fa";

export default function VendorApplyPage() {
  const router = useRouter();
  const { vendor, loading } = useVendorProfile();

  useEffect(() => {
    if (!loading && vendor) {
      router.replace("/vendor/dashboard");
    }
  }, [loading, vendor, router]);

  if (loading) return <p className="text-silver">{fa.vendor.loading}</p>;
  if (vendor) return <p className="text-silver">{fa.vendor.applyAlreadyVendor}</p>;

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader title={fa.vendor.applyTitle} />
      <p className="max-w-2xl text-silver">{fa.vendor.applySubtitle}</p>
      <VendorApplyForm />
    </section>
  );
}
