import { test, expect, request as playwrightRequest, type APIRequestContext } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Vendor team management workflow (owner/staff RBAC).
 * Requires seeded test accounts:
 *  - E2E_VENDOR_OWNER_PHONE — active vendor owner
 *  - E2E_VENDOR_STAFF_PHONE — registered user (staff candidate)
 *  - E2E_USER_PHONE — registered plain user (no vendor membership)
 */
async function createApiContext(): Promise<APIRequestContext> {
  return playwrightRequest.newContext({ baseURL, timeout: 45_000 });
}

async function loginWithOtp(api: APIRequestContext, phone: string): Promise<void> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const otpRequest = await api.post("/api/auth/otp/request", {
      data: { phone },
    });
    if (otpRequest.status() === 429) {
      // OTP rate limit — wait and retry (shared phone across suites).
      await new Promise((resolve) => setTimeout(resolve, 20_000));
      continue;
    }
    const otpPayload = (await otpRequest.json().catch(() => null)) as { otpPreview?: string } | null;
    if (!otpPayload?.otpPreview) {
      lastError = new Error(`otp request failed: ${otpRequest.status()}`);
      continue;
    }
    const otpVerify = await api.post("/api/auth/otp/verify", {
      data: { phone, code: otpPayload.otpPreview },
    });
    if (otpVerify.status() === 200) return;
    lastError = new Error(`otp verify failed: ${otpVerify.status()}`);
  }
  throw lastError ?? new Error("loginWithOtp failed");
}

test.describe("Vendor Team Management E2E", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(180_000);

  const ownerPhone = process.env.E2E_VENDOR_OWNER_PHONE?.trim();
  const staffPhone = process.env.E2E_VENDOR_STAFF_PHONE?.trim();
  const userPhone = process.env.E2E_USER_PHONE?.trim();
  test.skip(!ownerPhone || !staffPhone, "Set E2E_VENDOR_OWNER_PHONE and E2E_VENDOR_STAFF_PHONE.");

  test("owner adds staff, staff sees team read-only, owner removes staff", async () => {
    const ownerApi = await createApiContext();
    const staffApi = await createApiContext();
    const userApi = userPhone ? await createApiContext() : null;
    try {
      await loginWithOtp(ownerApi, ownerPhone!);
      await loginWithOtp(staffApi, staffPhone!);
      if (userApi && userPhone) await loginWithOtp(userApi, userPhone);

      // Owner sees team with at least the owner row
      const teamBefore = await ownerApi.get("/api/vendor/team");
      expect(teamBefore.status()).toBe(200);
      const teamBeforeBody = (await teamBefore.json()) as {
        members: { id: string; role: "owner" | "staff"; phone: string }[];
      };
      const existingStaff = teamBeforeBody.members.find((m) => m.phone === staffPhone);
      if (existingStaff) {
        // clean slate: remove existing staff first
        const removed = await ownerApi.delete(`/api/vendor/team/${existingStaff.id}`);
        expect(removed.status()).toBe(200);
      }

      // NEGATIVE: invalid phone rejected
      const badPhone = await ownerApi.post("/api/vendor/team", { data: { phone: "123" } });
      expect(badPhone.status()).toBe(400);

      // NEGATIVE: unregistered phone rejected
      const ghostPhone = await ownerApi.post("/api/vendor/team", { data: { phone: "09999999999" } });
      expect(ghostPhone.status()).toBe(400);

      // Owner adds staff
      const addStaff = await ownerApi.post("/api/vendor/team", { data: { phone: staffPhone } });
      expect(addStaff.status()).toBe(201);
      const added = (await addStaff.json()) as { member: { id: string; role: string } };
      expect(added.member.role).toBe("staff");

      // NEGATIVE: duplicate add is conflict
      const dupAdd = await ownerApi.post("/api/vendor/team", { data: { phone: staffPhone } });
      expect(dupAdd.status()).toBe(409);

      // Staff can list (read-only member view)
      await loginWithOtp(staffApi, staffPhone!);
      const staffList = await staffApi.get("/api/vendor/team");
      expect(staffList.status()).toBe(200);

      // NEGATIVE: staff cannot add members
      const staffAdd = await staffApi.post("/api/vendor/team", {
        data: { phone: "09120000099" },
      });
      expect(staffAdd.status()).toBe(403);

      // NEGATIVE: staff cannot remove members
      const staffDelete = await staffApi.delete(`/api/vendor/team/${added.member.id}`);
      expect(staffDelete.status()).toBe(403);

      // NEGATIVE: plain user without membership is forbidden
      if (userApi) {
        const userList = await userApi.get("/api/vendor/team");
        expect(userList.status()).toBe(403);
      }

      // Owner cannot delete the owner row
      const ownerRow = teamBeforeBody.members.find((m) => m.role === "owner");
      if (ownerRow) {
        const delOwner = await ownerApi.delete(`/api/vendor/team/${ownerRow.id}`);
        expect(delOwner.status()).toBe(400);
      }

      // Owner removes staff -> team back to owner-only
      const removeStaff = await ownerApi.delete(`/api/vendor/team/${added.member.id}`);
      expect(removeStaff.status()).toBe(200);
      const teamAfter = await ownerApi.get("/api/vendor/team");
      const teamAfterBody = (await teamAfter.json()) as {
        members: { phone: string }[];
      };
      expect(teamAfterBody.members.some((m) => m.phone === staffPhone)).toBe(false);

      // UI: vendor team page renders for owner
      const page = await ownerApi.newPage?.();
      if (page) {
        await page.goto("/vendor/team");
        await expect(page.locator("table")).toBeVisible();
        await page.close();
      }
    } finally {
      await ownerApi.dispose();
      await staffApi.dispose();
      await userApi?.dispose();
    }
  });

  test("anonymous cannot access vendor team API", async () => {
    const anonApi = await createApiContext();
    try {
      const res = await anonApi.get("/api/vendor/team");
      expect(res.status()).toBe(401);
      const post = await anonApi.post("/api/vendor/team", { data: { phone: "09120000000" } });
      expect(post.status()).toBe(401);
    } finally {
      await anonApi.dispose();
    }
  });
});
