import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    otpVerificationCode: {
      create: vi.fn(),
      updateMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: mocks.prisma,
}));

vi.mock("@/lib/server/env", () => ({
  serverEnv: { otpTtlMinutes: 2 },
}));

import { issueOtpCode, verifyAndConsumeOtpCode } from "@/lib/server/auth/otp";

describe("server auth otp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes pending OTPs before issuing new code", async () => {
    await issueOtpCode("09121234567");

    expect(mocks.prisma.otpVerificationCode.updateMany).toHaveBeenCalled();
    expect(mocks.prisma.otpVerificationCode.create).toHaveBeenCalled();
  });

  it("returns too_many_attempts as soon as invalid retry reaches threshold", async () => {
    mocks.prisma.otpVerificationCode.findFirst.mockResolvedValue({
      id: "otp-1",
      phone: "0912",
      codeHash: "other-hash",
      attempts: 4,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await verifyAndConsumeOtpCode("0912", "123456");
    expect(result).toBe("too_many_attempts");
    expect(mocks.prisma.otpVerificationCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { attempts: { increment: 1 } },
      })
    );
  });

  it("consumes expired otp and returns expired", async () => {
    mocks.prisma.otpVerificationCode.findFirst.mockResolvedValue({
      id: "otp-2",
      phone: "0912",
      codeHash: "hash",
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });

    const result = await verifyAndConsumeOtpCode("0912", "123456");
    expect(result).toBe("expired");
    expect(mocks.prisma.otpVerificationCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { consumedAt: expect.any(Date) },
      })
    );
  });
});
