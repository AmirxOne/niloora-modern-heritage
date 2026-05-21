import { randomUUID } from "node:crypto";
import type { User } from "@prisma/client";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";

function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export async function resolveCheckoutUser(input: {
  phone: string;
  fullName: string;
  email?: string | null;
}): Promise<User> {
  const phone = normalizeIranPhone(input.phone);
  if (!phone) {
    throw new Error("invalid_phone");
  }

  const email = input.email?.trim() || null;
  const { firstName, lastName } = splitFullName(input.fullName);

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    const updates: Partial<{
      email: string;
      firstName: string;
      lastName: string;
    }> = {};

    if (email && !existing.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (!taken) updates.email = email;
    }
    if (firstName && !existing.firstName) updates.firstName = firstName;
    if (lastName && !existing.lastName) updates.lastName = lastName;

    if (Object.keys(updates).length > 0) {
      return prisma.user.update({
        where: { id: existing.id },
        data: updates,
      });
    }
    return existing;
  }

  return prisma.user.create({
    data: {
      name: input.fullName.trim() || phone,
      phone,
      firstName: firstName || null,
      lastName: lastName,
      email,
      role: "user",
      passwordHash: `GUEST_${randomUUID()}`,
    },
  });
}
