import { createHash } from "node:crypto";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";

const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 5;

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function otpTtlMs(): number {
  return serverEnv.otpTtlMinutes * 60 * 1000;
}

function generateOtpCode(): string {
  const value = Math.floor(Math.random() * 1_000_000);
  return value.toString().padStart(OTP_LENGTH, "0");
}

export async function issueOtpCode(phone: string) {
  // FLOW: generate plain code -> store only hash -> return plain code for delivery channel.
  const code = generateOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + otpTtlMs());

  await prisma.otpVerificationCode.create({
    data: {
      phone,
      codeHash,
      expiresAt,
    },
  });

  return {
    code,
    expiresAt,
  };
}

export async function revokeLatestPendingOtp(phone: string): Promise<void> {
  const latest = await prisma.otpVerificationCode.findFirst({
    where: { phone, consumedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (latest) {
    await prisma.otpVerificationCode.delete({ where: { id: latest.id } });
  }
}

type VerifyOtpResult = "ok" | "invalid" | "expired" | "too_many_attempts";

export async function verifyAndConsumeOtpCode(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  // BOUNDARY: only latest non-consumed code is valid; attempts and expiry enforced server-side.
  const latest = await prisma.otpVerificationCode.findFirst({
    where: {
      phone,
      consumedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latest) return "invalid";
  if (latest.expiresAt.getTime() <= Date.now()) return "expired";
  if (latest.attempts >= MAX_VERIFY_ATTEMPTS) return "too_many_attempts";

  const inputHash = hashOtp(code);
  if (inputHash !== latest.codeHash) {
    await prisma.otpVerificationCode.update({
      where: { id: latest.id },
      data: { attempts: { increment: 1 } },
    });
    return "invalid";
  }

  await prisma.otpVerificationCode.update({
    where: { id: latest.id },
    data: { consumedAt: new Date() },
  });

  return "ok";
}
