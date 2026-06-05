import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function tokenTtlMs() {
  return serverEnv.resetTokenTtlMinutes * 60 * 1000;
}

export async function createResetToken(userId: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex").toUpperCase();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + tokenTtlMs());

  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  await prisma.passwordResetToken.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

export async function verifyResetToken(userId: string, rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken.trim().toUpperCase());
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      userId,
      token: tokenHash,
      expiresAt: { gt: new Date() },
    },
  });
  return Boolean(token);
}

export async function consumeResetToken(userId: string, rawToken: string): Promise<boolean> {
  const tokenHash = hashToken(rawToken.trim().toUpperCase());
  const deleted = await prisma.passwordResetToken.deleteMany({
    where: {
      userId,
      token: tokenHash,
      expiresAt: { gt: new Date() },
    },
  });
  return deleted.count > 0;
}
