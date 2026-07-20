import { POST } from "@/app/api/vendor/media/route";
import { parseJsonResponse } from "../../helpers/parse-response";
import { regularUser } from "../../fixtures/users";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireVendorMembership: jest.fn(),
}));

jest.mock("@/lib/server/media/vendor-upload", () => ({
  VENDOR_MEDIA_MAX_BYTES: 8 * 1024 * 1024,
  storeVendorMediaAsset: jest.fn(),
}));

jest.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { requireVendorMembership } from "@/lib/server/vendor/vendor-guards";
import { storeVendorMediaAsset } from "@/lib/server/media/vendor-upload";

describe("Integration — POST /api/vendor/media", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(requireVendorMembership).mockResolvedValue({
      vendorId: "vendor-1",
      userId: regularUser.id,
      active: true,
      role: "owner",
      vendor: { id: "vendor-1", status: "active" },
    } as never);
    jest.mocked(storeVendorMediaAsset).mockResolvedValue({
      id: "asset-1",
      vendorId: "vendor-1",
      uploadedByUserId: regularUser.id,
      originalName: "ring.png",
      mimeType: "image/png",
      sizeBytes: 2048,
      width: 1200,
      height: 1200,
      url: "/uploads/vendor-media/vendor-1/asset-1.webp",
      createdAt: new Date().toISOString(),
    });
  });

  it("rejects unauthorized request", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2, 3])], "ring.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/vendor/media", {
        method: "POST",
        body: form,
      })
    );

    expect(response.status).toBe(401);
  });

  it("forbids users without vendor membership", async () => {
    jest.mocked(requireVendorMembership).mockRejectedValue(new Error("VENDOR_MEMBERSHIP_REQUIRED"));
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2, 3])], "ring.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/vendor/media", {
        method: "POST",
        body: form,
      })
    );

    expect(response.status).toBe(403);
  });

  it("rejects invalid mime type", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2, 3])], "ring.txt", { type: "text/plain" }));

    const response = await POST(
      new Request("http://localhost/api/vendor/media", {
        method: "POST",
        body: form,
      })
    );

    expect(response.status).toBe(400);
  });

  it("uploads image and returns canonical url", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array([1, 2, 3])], "ring.png", { type: "image/png" }));

    const response = await POST(
      new Request("http://localhost/api/vendor/media", {
        method: "POST",
        body: form,
      })
    );
    const { status, json } = await parseJsonResponse<{
      asset: { url: string; canonicalUrl: string };
    }>(response);

    expect(status).toBe(200);
    expect(storeVendorMediaAsset).toHaveBeenCalled();
    expect(json.asset.canonicalUrl).toBe("/uploads/vendor-media/vendor-1/asset-1.webp");
  });
});
