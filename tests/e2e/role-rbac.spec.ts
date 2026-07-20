import { test, expect, request as playwrightRequest, type APIRequestContext } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

function randomIranPhone(): string {
  const suffix = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
  return `09${suffix}`;
}

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

test.describe("Role RBAC E2E", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  test("editor/reviewer can access posts workflow but not admin products", async () => {
    const editorPhone = process.env.E2E_EDITOR_PHONE?.trim();
    const reviewerPhone = process.env.E2E_REVIEWER_PHONE?.trim();
    test.skip(
      !editorPhone || !reviewerPhone,
      "Set E2E_EDITOR_PHONE and E2E_REVIEWER_PHONE for role-specific RBAC checks."
    );

    const editorApi = await createApiContext();
    const reviewerApi = await createApiContext();
    try {
      await loginWithOtp(editorApi, editorPhone!);
      await loginWithOtp(reviewerApi, reviewerPhone!);

      const editorPosts = await editorApi.get("/api/admin/posts");
      expect(editorPosts.status()).toBe(200);
      const editorAdminProducts = await editorApi.get("/api/admin/products");
      expect(editorAdminProducts.status()).toBe(403);

      const reviewerPosts = await reviewerApi.get("/api/admin/posts");
      expect(reviewerPosts.status()).toBe(200);
      const reviewerAdminProducts = await reviewerApi.get("/api/admin/products");
      expect(reviewerAdminProducts.status()).toBe(403);
    } finally {
      await editorApi.dispose();
      await reviewerApi.dispose();
    }
  });

  test("vendor owner can create/submit product, staff is blocked for owner-only actions", async () => {
    const ownerPhone = process.env.E2E_VENDOR_OWNER_PHONE?.trim();
    test.skip(!ownerPhone, "Set E2E_VENDOR_OWNER_PHONE (active owner membership) for vendor RBAC checks.");

    const ownerApi = await createApiContext();
    const staffPhone = process.env.E2E_VENDOR_STAFF_PHONE?.trim() || null;
    const staffApi = staffPhone ? await createApiContext() : null;
    let productId: string | null = null;
    try {
      await loginWithOtp(ownerApi, ownerPhone!);

      const ownerCreate = await ownerApi.post("/api/vendor/products", {
        data: {
          name: "Vendor Role Ring",
          namePersian: "انگشتر نقش فروشنده",
          image: "/uploads/vendor-media/vendor-role/test.webp",
          price: 1500000,
          stock: 2,
          category: "signet",
          metal: "sterling",
          stone: "turquoise",
        },
      });
      expect(ownerCreate.status()).toBe(201);
      const ownerCreateBody = (await ownerCreate.json()) as { product?: { id?: string } };
      productId = ownerCreateBody.product?.id ?? null;
      expect(productId).toBeTruthy();

      if (staffApi && staffPhone) {
        await loginWithOtp(staffApi, staffPhone);
        const staffCreate = await staffApi.post("/api/vendor/products", {
          data: {
            name: "Staff Attempt Ring",
            namePersian: "تست استاف",
            image: "/uploads/vendor-media/vendor-role/test.webp",
            price: 1500000,
            stock: 1,
            category: "signet",
            metal: "sterling",
            stone: "turquoise",
          },
        });
        expect(staffCreate.status()).toBe(403);

        const staffSubmit = await staffApi.post(`/api/vendor/products/${productId}/submit`);
        expect(staffSubmit.status()).toBe(403);
      }

      const ownerSubmit = await ownerApi.post(`/api/vendor/products/${productId}/submit`);
      expect(ownerSubmit.status()).toBe(200);
    } finally {
      await ownerApi.dispose();
      await staffApi?.dispose();
    }
  });

  test("admin access works and normal user is blocked from admin domain", async () => {
    const adminPhone = process.env.E2E_ADMIN_PHONE?.trim();
    test.skip(!adminPhone, "Set E2E_ADMIN_PHONE for admin RBAC checks.");

    const adminApi = await createApiContext();
    const userApi = await createApiContext();
    try {
      await loginWithOtp(adminApi, adminPhone!);
      await loginWithOtp(userApi, randomIranPhone());

      const adminProducts = await adminApi.get("/api/admin/products");
      expect(adminProducts.status()).toBe(200);

      const userAdminProducts = await userApi.get("/api/admin/products");
      expect(userAdminProducts.status()).toBe(403);
    } finally {
      await adminApi.dispose();
      await userApi.dispose();
    }
  });
});
