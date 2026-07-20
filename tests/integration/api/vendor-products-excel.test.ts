import { GET, POST } from "@/app/api/vendor/products/excel/route";
import { serializeExcelBuffer } from "@/lib/server/excel";
import { parseJsonResponse } from "../../helpers/parse-response";
import { regularUser } from "../../fixtures/users";

jest.mock("@/lib/server/auth/session", () => ({
  readSessionUser: jest.fn(),
}));

jest.mock("@/lib/server/vendor/vendor-guards", () => ({
  requireActiveVendorOwner: jest.fn(),
}));

jest.mock("@/lib/server/marketplace/vendor-product-service", () => ({
  createVendorProduct: jest.fn(),
}));

jest.mock("@/lib/server/audit-log", () => ({
  writeAdminAuditLog: jest.fn(),
}));

import { readSessionUser } from "@/lib/server/auth/session";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { createVendorProduct } from "@/lib/server/marketplace/vendor-product-service";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function buildWorkbook(rows: Array<Record<string, string>>): Uint8Array {
  return serializeExcelBuffer(
    [
      "name",
      "namePersian",
      "price",
      "stock",
      "category",
      "metal",
      "stone",
      "listingHeadline",
      "image",
    ],
    rows
  );
}

describe("Integration — /api/vendor/products/excel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(readSessionUser).mockResolvedValue(regularUser as never);
    jest.mocked(requireActiveVendorOwner).mockResolvedValue({
      vendorId: "vendor-1",
      role: "owner",
      vendor: { status: "active" },
    } as never);
    jest.mocked(createVendorProduct).mockResolvedValue({ id: "prod-1" } as never);
  });

  it("rejects unauthorized upload", async () => {
    jest.mocked(readSessionUser).mockResolvedValue(null);
    const response = await POST(
      new Request("http://localhost/api/vendor/products/excel", {
        method: "POST",
      })
    );
    expect(response.status).toBe(401);
  });

  it("forbids staff from upload", async () => {
    jest.mocked(requireActiveVendorOwner).mockRejectedValue(
      new Error("VENDOR_ROLE_FORBIDDEN")
    );

    const response = await POST(
      new Request("http://localhost/api/vendor/products/excel", {
        method: "POST",
        headers: { "Content-Type": EXCEL_MIME },
        body: Buffer.from(buildWorkbook([])),
      })
    );
    expect(response.status).toBe(403);
  });

  it("downloads excel template for vendor owner", async () => {
    const response = await GET(
      new Request("http://localhost/api/vendor/products/excel", { method: "GET" })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain(EXCEL_MIME);
  });

  it("downloads excel sample file for vendor owner", async () => {
    const response = await GET(
      new Request("http://localhost/api/vendor/products/excel?kind=sample", {
        method: "GET",
      })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(
      "vendor-products-sample.xlsx"
    );
  });

  it("imports valid rows and creates products", async () => {
    const response = await POST(
      new Request("http://localhost/api/vendor/products/excel", {
        method: "POST",
        headers: { "Content-Type": EXCEL_MIME },
        body: Buffer.from(
          buildWorkbook([
            {
              name: "Vendor Bulk Ring",
              namePersian: "انگشتر گروهی",
              price: "1450000",
              stock: "2",
              category: "signet",
              metal: "sterling",
              stone: "turquoise",
              listingHeadline: "انگشتر گروهی فیروزه",
              image: "/uploads/vendor-media/vendor-1/bulk.webp",
            },
          ])
        ),
      })
    );
    const { status, json } = await parseJsonResponse<{ created: number; failed: number }>(response);

    expect(status).toBe(200);
    expect(json.created).toBe(1);
    expect(json.failed).toBe(0);
    expect(createVendorProduct).toHaveBeenCalledTimes(1);
    expect(writeAdminAuditLog).toHaveBeenCalled();
  });

  it("reports row-level validation errors", async () => {
    const response = await POST(
      new Request("http://localhost/api/vendor/products/excel", {
        method: "POST",
        headers: { "Content-Type": EXCEL_MIME },
        body: Buffer.from(
          buildWorkbook([
            {
              name: "x",
              namePersian: "",
              price: "abc",
              stock: "-1",
              category: "signet",
              metal: "sterling",
              stone: "turquoise",
              listingHeadline: "",
              image: "not-safe-url",
            },
          ])
        ),
      })
    );
    const { status, json } = await parseJsonResponse<{
      created: number;
      failed: number;
      errors: Array<{ row: number; message: string }>;
    }>(response);

    expect(status).toBe(200);
    expect(json.created).toBe(0);
    expect(json.failed).toBe(1);
    expect(json.errors[0]?.row).toBe(2);
    expect(createVendorProduct).not.toHaveBeenCalled();
  });
});
