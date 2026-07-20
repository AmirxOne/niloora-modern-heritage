import { test, expect, request as playwrightRequest, type APIRequestContext } from "@playwright/test";
import * as XLSX from "xlsx";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

async function createApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({
    baseURL,
    timeout: 45_000,
  });
}

async function loginWithOtp(api: APIRequestContext, phone: string): Promise<void> {
  const otpRequest = await api.post("/api/auth/otp/request", {
    data: { phone },
  });
  expect(otpRequest.status()).toBe(200);
  const otpPayload = (await otpRequest.json()) as { otpPreview?: string };
  expect(otpPayload.otpPreview).toBeTruthy();

  const otpVerify = await api.post("/api/auth/otp/verify", {
    data: { phone, code: otpPayload.otpPreview },
  });
  expect(otpVerify.status()).toBe(200);
}

function buildProductExcelBuffer(): Buffer {
  const headers = [
    "name",
    "namePersian",
    "price",
    "stock",
    "category",
    "metal",
    "stone",
    "listingHeadline",
    "image",
  ];
  const row = [
    `Bulk Ring ${Date.now()}`,
    "انگشتر اکسل فروشنده",
    "1990000",
    "2",
    "signet",
    "sterling",
    "turquoise",
    "محصول ثبت گروهی اکسل",
    "/uploads/vendor-media/vendor-bulk-upload/sample.webp",
  ];
  const worksheet = XLSX.utils.aoa_to_sheet([headers, row]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

test.describe("Vendor products bulk upload", () => {
  test("rejects unauthenticated excel upload", async ({ request }) => {
    const upload = await request.post("/api/vendor/products/excel", {
      headers: { "Content-Type": EXCEL_MIME },
      data: buildProductExcelBuffer(),
    });
    expect(upload.status()).toBe(401);
  });

  test("owner can upload products by excel", async () => {
    const ownerPhone = process.env.E2E_VENDOR_OWNER_PHONE?.trim();
    test.skip(!ownerPhone, "Set E2E_VENDOR_OWNER_PHONE (active owner membership) for vendor bulk upload checks.");

    const ownerApi = await createApiContext();
    try {
      await loginWithOtp(ownerApi, ownerPhone!);

      const dashboardResponse = await ownerApi.get("/api/vendor/dashboard");
      if (dashboardResponse.status() !== 200) {
        test.skip(true, "Vendor dashboard is unavailable for configured owner user.");
      }
      const dashboard = (await dashboardResponse.json()) as {
        dashboard?: { quota?: { atCreateLimit?: boolean } };
      };
      test.skip(Boolean(dashboard.dashboard?.quota?.atCreateLimit), "Vendor create quota is full for configured owner user.");

      const upload = await ownerApi.post("/api/vendor/products/excel", {
        headers: { "Content-Type": EXCEL_MIME },
        data: buildProductExcelBuffer(),
      });
      expect(upload.status()).toBe(200);

      const payload = (await upload.json()) as {
        totalRows?: number;
        created?: number;
        failed?: number;
      };
      expect(payload.totalRows).toBe(1);
      expect(payload.created).toBe(1);
      expect(payload.failed).toBe(0);
    } finally {
      await ownerApi.dispose();
    }
  });

  test("staff is blocked from excel upload", async () => {
    const staffPhone = process.env.E2E_VENDOR_STAFF_PHONE?.trim();
    test.skip(!staffPhone, "Set E2E_VENDOR_STAFF_PHONE for staff deny checks.");

    const staffApi = await createApiContext();
    try {
      await loginWithOtp(staffApi, staffPhone!);
      const upload = await staffApi.post("/api/vendor/products/excel", {
        headers: { "Content-Type": EXCEL_MIME },
        data: buildProductExcelBuffer(),
      });
      expect(upload.status()).toBe(403);
    } finally {
      await staffApi.dispose();
    }
  });
});
