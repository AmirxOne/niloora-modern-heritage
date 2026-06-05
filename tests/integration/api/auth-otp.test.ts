import { POST } from "@/app/api/auth/otp/request/route";
import { parseJsonResponse } from "../../helpers/parse-response";

jest.mock("@/lib/server/auth/otp-rate-limit", () => ({
  assertOtpRequestRateLimit: jest.fn(() => ({ allowed: true })),
}));

jest.mock("@/lib/server/auth/otp", () => ({
  issueOtpCode: jest.fn(),
  revokeLatestPendingOtp: jest.fn(),
}));

jest.mock("@/lib/server/sms/send-otp", () => ({
  deliverOtpSms: jest.fn(),
  isOtpDevPreviewMode: jest.fn(() => true),
  isSmsConfiguredForProduction: jest.fn(() => false),
  OtpSmsError: class OtpSmsError extends Error {},
}));

jest.mock("@/lib/server/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import { issueOtpCode } from "@/lib/server/auth/otp";
import { prisma } from "@/lib/server/prisma";

describe("Integration — POST /api/auth/otp/request", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(prisma.user.findUnique).mockResolvedValue(null);
    jest.mocked(issueOtpCode).mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() + 120_000),
    });
  });

  it("rejects invalid phone numbers", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "invalid" }),
      })
    );
    expect(response.status).toBe(400);
  });

  it("issues OTP for valid Iranian mobile", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "09121234567" }),
      })
    );
    const { status, json } = await parseJsonResponse<{ ok?: boolean }>(response);

    expect(status).toBe(200);
    expect(issueOtpCode).toHaveBeenCalled();
    expect(json).toBeDefined();
  });
});
