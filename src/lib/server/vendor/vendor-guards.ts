import { prisma } from "@/lib/server/prisma";
import type { VendorStatus } from "@/lib/types/vendor";

const ACTIVE_VENDOR: VendorStatus = "active";

export async function getVendorMembershipForUser(userId: string) {
  return prisma.vendorMember.findUnique({
    where: { userId },
    include: {
      vendor: { include: { settings: true } },
    },
  });
}

export async function requireVendorMembership(userId: string) {
  const membership = await getVendorMembershipForUser(userId);
  if (!membership?.active) {
    throw new Error("VENDOR_MEMBERSHIP_REQUIRED");
  }
  return membership;
}

export async function requireActiveVendor(userId: string) {
  const membership = await requireVendorMembership(userId);
  if (membership.vendor.status !== ACTIVE_VENDOR) {
    throw new Error("VENDOR_NOT_ACTIVE");
  }
  return membership;
}

export function isActiveVendorStatus(status: string): boolean {
  return status === ACTIVE_VENDOR;
}
