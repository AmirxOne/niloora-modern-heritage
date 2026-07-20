import { PATCH } from "@/app/api/vendor/profile/route";
import { regularUser } from "../../fixtures/users";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireVendorOwner: jest.fn(),
}));

jest.mock("@/lib/server/vendor/vendor-service", () => ({
  updateVendorProfile: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { updateVendorProfile } from "@/lib/server/vendor/vendor-service";
import { requireVendorOwner } from "@/lib/server/vendor/vendor-guards";

describe("Integration — PATCH /api/vendor/profile branding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(requireVendorOwner).mockResolvedValue({
      vendorId: "vendor-1",
      role: "owner",
      vendor: { status: "active" },
    } as never);
    jest.mocked(updateVendorProfile).mockResolvedValue({
      id: "vendor-1",
      profileImageUrl: "/uploads/vendor-media/vendor-1/profile.webp",
      bannerImageUrl: "/uploads/vendor-media/vendor-1/banner.webp",
    } as never);
  });

  it("rejects invalid profile image url", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImageUrl: "javascript:alert(1)",
        }),
      })
    );
    expect(response.status).toBe(400);
    expect(updateVendorProfile).not.toHaveBeenCalled();
  });

  it("updates banner and profile image urls", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImageUrl: "/uploads/vendor-media/vendor-1/profile.webp",
          bannerImageUrl: "/uploads/vendor-media/vendor-1/banner.webp",
        }),
      })
    );
    expect(response.status).toBe(200);
    expect(updateVendorProfile).toHaveBeenCalledWith(
      regularUser.id,
      expect.objectContaining({
        profileImageUrl: "/uploads/vendor-media/vendor-1/profile.webp",
        bannerImageUrl: "/uploads/vendor-media/vendor-1/banner.webp",
      })
    );
  });
});
