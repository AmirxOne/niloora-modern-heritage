import { prisma } from "@/lib/server/prisma";
import { slugifyVendorSlug, toVendorProfileDto } from "@/lib/server/vendor/vendor-dto";
import { getVendorMembershipForUser } from "@/lib/server/vendor/vendor-guards";

export type ApplyVendorInput = {
  userId: string;
  displayName: string;
  displayNameFa?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  slug?: string | null;
};

function buildUniqueSlug(base: string): string {
  const normalized = slugifyVendorSlug(base);
  return normalized || `vendor-${Date.now().toString(36)}`;
}

export async function applyVendor(input: ApplyVendorInput) {
  const existing = await getVendorMembershipForUser(input.userId);
  if (existing) {
    return toVendorProfileDto(existing.vendor, existing.role as "owner" | "staff");
  }

  const baseSlug = buildUniqueSlug(input.slug ?? input.displayName);
  let slug = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const taken = await prisma.vendor.findUnique({ where: { slug } });
    if (!taken) break;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const vendor = await prisma.$transaction(async (tx) => {
    const created = await tx.vendor.create({
      data: {
        slug,
        displayName: input.displayName.trim(),
        displayNameFa: input.displayNameFa?.trim() || null,
        description: input.description?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        status: "draft",
        settings: {
          create: {},
        },
        members: {
          create: {
            userId: input.userId,
            role: "owner",
          },
        },
      },
      include: { settings: true, members: true },
    });
    return created;
  });

  const member = vendor.members.find((m) => m.userId === input.userId);
  return toVendorProfileDto(vendor, (member?.role ?? "owner") as "owner" | "staff");
}

export async function submitVendorApplication(userId: string) {
  const membership = await getVendorMembershipForUser(userId);
  if (!membership) throw new Error("VENDOR_NOT_FOUND");
  if (membership.vendor.status !== "draft" && membership.vendor.status !== "rejected") {
    throw new Error("VENDOR_SUBMIT_INVALID_STATE");
  }

  const updated = await prisma.vendor.update({
    where: { id: membership.vendorId },
    data: {
      status: "pending_review",
      submittedAt: new Date(),
      rejectionReason: null,
    },
    include: { settings: true, members: true },
  });

  return toVendorProfileDto(updated, membership.role as "owner" | "staff");
}

export async function getVendorForUser(userId: string) {
  const membership = await getVendorMembershipForUser(userId);
  if (!membership) return null;
  return toVendorProfileDto(membership.vendor, membership.role as "owner" | "staff");
}

export type UpdateVendorProfileInput = {
  displayName?: string;
  displayNameFa?: string | null;
  description?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
};

export async function updateVendorProfile(userId: string, input: UpdateVendorProfileInput) {
  const membership = await getVendorMembershipForUser(userId);
  if (!membership) throw new Error("VENDOR_NOT_FOUND");

  const updated = await prisma.vendor.update({
    where: { id: membership.vendorId },
    data: {
      ...(input.displayName !== undefined ? { displayName: input.displayName.trim() } : {}),
      ...(input.displayNameFa !== undefined
        ? { displayNameFa: input.displayNameFa?.trim() || null }
        : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.contactPhone !== undefined
        ? { contactPhone: input.contactPhone?.trim() || null }
        : {}),
      ...(input.contactEmail !== undefined
        ? { contactEmail: input.contactEmail?.trim() || null }
        : {}),
    },
    include: { settings: true, members: true },
  });

  return toVendorProfileDto(updated, membership.role as "owner" | "staff");
}

export async function approveVendor(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error("VENDOR_NOT_FOUND");
  if (vendor.status !== "pending_review") throw new Error("VENDOR_APPROVE_INVALID_STATE");

  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      status: "active",
      approvedAt: new Date(),
      rejectionReason: null,
    },
    include: { settings: true, members: true },
  });

  const owner = updated.members[0];
  return toVendorProfileDto(updated, (owner?.role ?? "owner") as "owner" | "staff");
}

export async function rejectVendor(vendorId: string, reason: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) throw new Error("VENDOR_NOT_FOUND");
  if (vendor.status !== "pending_review") throw new Error("VENDOR_REJECT_INVALID_STATE");

  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      status: "rejected",
      rejectionReason: reason.trim(),
    },
    include: { settings: true, members: true },
  });

  const owner = updated.members[0];
  return toVendorProfileDto(updated, (owner?.role ?? "owner") as "owner" | "staff");
}

export async function listPendingVendors() {
  return listAdminVendors("pending_review");
}

export type AdminVendorListStatus = "pending_review" | "active" | "all";

export async function listAdminVendors(status: AdminVendorListStatus = "all") {
  const rows = await prisma.vendor.findMany({
    where: status === "all" ? undefined : { status },
    include: { settings: true, members: true },
    orderBy:
      status === "pending_review"
        ? { submittedAt: "asc" }
        : { updatedAt: "desc" },
  });
  return rows.map((row) => {
    const owner = row.members[0];
    return toVendorProfileDto(row, (owner?.role ?? "owner") as "owner" | "staff");
  });
}
