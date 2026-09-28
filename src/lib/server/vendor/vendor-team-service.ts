import { prisma } from "@/lib/server/prisma";

/**
 * Team management for a vendor: the owner can invite/remove staff members.
 * Staff accounts must already exist (registered via OTP) — the invite links
 * an existing user by phone, mirroring how orders resolve users by phone.
 */

export type VendorTeamMemberDto = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  role: "owner" | "staff";
  active: boolean;
  joinedAt: string;
};

export async function listVendorTeam(vendorId: string): Promise<VendorTeamMemberDto[]> {
  const members = await prisma.vendorMember.findMany({
    where: { vendorId },
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    phone: m.user.phone,
    role: m.role as "owner" | "staff",
    active: m.active,
    joinedAt: m.createdAt.toISOString(),
  }));
}

export async function addVendorStaffMember(input: {
  vendorId: string;
  phone: string;
  name?: string | null;
}): Promise<VendorTeamMemberDto> {
  const user = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (!user) throw new Error("VENDOR_STAFF_USER_NOT_FOUND");

  const existingMembership = await prisma.vendorMember.findUnique({
    where: { userId: user.id },
  });
  if (existingMembership) throw new Error("VENDOR_STAFF_ALREADY_MEMBER");

  const member = await prisma.vendorMember.create({
    data: {
      vendorId: input.vendorId,
      userId: user.id,
      role: "staff",
    },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });

  return {
    id: member.id,
    userId: member.userId,
    name: member.user.name,
    phone: member.user.phone,
    role: "staff",
    active: member.active,
    joinedAt: member.createdAt.toISOString(),
  };
}

export async function removeVendorStaffMember(input: {
  vendorId: string;
  memberId: string;
}): Promise<{ id: string }> {
  const member = await prisma.vendorMember.findUnique({
    where: { id: input.memberId },
  });
  if (!member || member.vendorId !== input.vendorId) {
    throw new Error("VENDOR_MEMBER_NOT_FOUND");
  }
  if (member.role === "owner") throw new Error("VENDOR_MEMBER_OWNER_IMMUTABLE");

  await prisma.vendorMember.delete({ where: { id: input.memberId } });
  return { id: input.memberId };
}
