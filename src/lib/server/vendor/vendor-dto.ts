import type { VendorMemberRole, VendorProfileDto, VendorStatus } from "@/lib/types/vendor";
import type { Vendor, VendorMember, VendorSettings } from "@prisma/client";

type VendorWithRelations = Vendor & {
  settings: VendorSettings | null;
  members?: VendorMember[];
};

export function slugifyVendorSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function toVendorProfileDto(
  vendor: VendorWithRelations,
  memberRole: VendorMemberRole
): VendorProfileDto {
  const settings = vendor.settings;
  return {
    id: vendor.id,
    slug: vendor.slug,
    displayName: vendor.displayName,
    displayNameFa: vendor.displayNameFa ?? undefined,
    description: vendor.description ?? undefined,
    profileImageUrl: vendor.profileImageUrl ?? undefined,
    bannerImageUrl: vendor.bannerImageUrl ?? undefined,
    contactPhone: vendor.contactPhone ?? undefined,
    contactEmail: vendor.contactEmail ?? undefined,
    status: vendor.status as VendorStatus,
    rejectionReason: vendor.rejectionReason ?? undefined,
    submittedAt: vendor.submittedAt?.toISOString(),
    approvedAt: vendor.approvedAt?.toISOString(),
    settings: {
      maxActiveProducts: settings?.maxActiveProducts ?? 3,
      maxPendingSubmissions: settings?.maxPendingSubmissions ?? 5,
      quotaMode: settings?.quotaMode === "unlimited" ? "unlimited" : "fixed",
    },
    memberRole,
  };
}
