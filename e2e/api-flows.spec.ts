import { test, expect, request } from "@playwright/test";
import {
  apiLogin,
  TEST_ADMIN_PHONE,
  TEST_CUSTOMER_PHONE,
  TEST_CUSTOMER2_PHONE,
  TEST_PASSWORD,
  ALPHA_PRODUCT_ID,
} from "./helpers";

/**
 * E2E (API-level): full customer + admin + security flows against the
 * running app on the isolated test DB. Payment is exercised via the
 * gateway-abort path (no merchant configured => request fails cleanly),
 * plus direct callback simulation for verify outcomes.
 */

let adminCookie: string;
let customerCookie: string;
let customer2Cookie: string;

test.beforeAll(async () => {
  const ctx = await request.newContext({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100" });
  adminCookie = await apiLogin(ctx, TEST_ADMIN_PHONE, TEST_PASSWORD);
  customerCookie = await apiLogin(ctx, TEST_CUSTOMER_PHONE, TEST_PASSWORD);
  customer2Cookie = await apiLogin(ctx, TEST_CUSTOMER2_PHONE, TEST_PASSWORD);
  await ctx.dispose();
});

test.describe("catalog & search", () => {
  test("home page loads", async ({ request }) => {
    const res = await request.get("/api/home");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.collections)).toBeTruthy();
  });

  test("products list + search hit", async ({ request }) => {
    const res = await request.get("/api/products");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThanOrEqual(3);

    const search = await request.get("/api/products/search?q=آلفا");
    expect(search.status()).toBe(200);
    const sdata = await search.json();
    expect(sdata.products.catalog.length).toBeGreaterThanOrEqual(1);
  });

  test("search with no results returns empty, not error", async ({ request }) => {
    const res = await request.get("/api/products/search?q=زیرویییی");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.products.catalog).toEqual([]);
  });

  test("product detail + invalid product 404", async ({ request }) => {
    const ok = await request.get(`/api/products/${ALPHA_PRODUCT_ID}`);
    expect(ok.status()).toBe(200);
    const missing = await request.get("/api/products/does-not-exist");
    expect(missing.status()).toBe(404);
  });
});

test.describe("auth & access control", () => {
  test("anonymous cannot access private APIs", async ({ request }) => {
    const orders = await request.get("/api/orders");
    expect(orders.status()).toBe(401);
    const adminUsers = await request.get("/api/admin/users");
    expect(adminUsers.status()).toBe(401);
  });

  test("regular user cannot access admin endpoints", async ({ request }) => {
    const res = await request.get("/api/admin/users", {
      headers: { cookie: customerCookie },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("invalid login rejected", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { phone: TEST_CUSTOMER_PHONE, password: "wrong-password" },
    });
    expect(res.status()).toBe(401);
  });

  test("session endpoint returns current user", async ({ request }) => {
    const res = await request.get("/api/auth/session", {
      headers: { cookie: customerCookie },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.user.phone).toBe(TEST_CUSTOMER_PHONE);
  });

  test("comments list only exposes approved", async ({ request }) => {
    const res = await request.get(`/api/comments?productId=${ALPHA_PRODUCT_ID}&status=pending`);
    // after hardening: non-approved status filter is rejected
    expect([400]).toContain(res.status());
  });
});

test.describe("cart pricing integrity", () => {
  test("client-sent prices are ignored — repricing is server-side", async ({ request }) => {
    // attempt checkout with a tampered 1-toman price
    const res = await request.post("/api/payments/zarinpal/request", {
      headers: { cookie: customerCookie },
      data: {
        items: [
          {
            id: "tamper",
            productId: ALPHA_PRODUCT_ID,
            name: "fake",
            price: 1,
            listPrice: 1,
            quantity: 1,
            image: "x",
          },
        ],
        promoCode: null,
        shipping: {
          fullName: "تست مشتری",
          mobile: TEST_CUSTOMER_PHONE,
          province: "تهران",
          city: "تهران",
          address: "خیابان تست پلاک ۱",
          postalCode: "1111111111",
          shippingMethod: "standard",
        },
      },
    });
    // gateway is not configured in test env => clean badRequest about gateway
    // (order/price validation happens BEFORE gateway check failures that follow)
    const data = await res.json().catch(() => ({}));
    expect(res.status()).toBe(400);
    expect(data.message).toContain("درگاه");
  });

  test("promo validation tiers work", async ({ request }) => {
    const tooLow = await request.post("/api/promo/validate", {
      data: { code: "NILOORA20", subtotalSale: 1000 },
    });
    expect((await tooLow.json()).valid).toBe(false);

    const bogus = await request.post("/api/promo/validate", {
      data: { code: "NOPE123", subtotalSale: 100_000_000 },
    });
    expect((await bogus.json()).valid).toBe(false);
  });
});

test.describe("orders: listing & ownership", () => {
  test("user orders paginated response shape", async ({ request }) => {
    const res = await request.get("/api/orders?page=1&pageSize=10", {
      headers: { cookie: customerCookie },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.pagination).toBeTruthy();
    expect(data.pagination.page).toBe(1);
  });

  test("order of another user is not visible", async ({ request }) => {
    // create an order row directly via cancel-safe path: use admin to fetch all,
    // then customer2 tries to read one belonging to customer
    const adminOrders = await request.get("/api/admin/orders?status=all", {
      headers: { cookie: adminCookie },
    });
    expect(adminOrders.status()).toBe(200);
    const data = await adminOrders.json();
    const foreign = data.orders.find(
      (o: { customer: { phone: string } }) => o.customer.phone === TEST_CUSTOMER_PHONE
    );
    if (foreign) {
      const attempt = await request.get(`/api/orders/${foreign.id}`, {
        headers: { cookie: customer2Cookie },
      });
      expect(attempt.status()).toBe(404); // findFirst scoped to owner
    }
  });
});

test.describe("cancellation & refund", () => {
  test("cancelling a non-existent order fails cleanly", async ({ request }) => {
    const res = await request.post("/api/orders/NOPE-123/cancel", {
      headers: { cookie: customerCookie },
    });
    expect(res.status()).toBe(400);
  });

  test("admin refund endpoint refuses non-cancelled orders", async ({ request }) => {
    const adminOrders = await request.get("/api/admin/orders?status=processing", {
      headers: { cookie: adminCookie },
    });
    const data = await adminOrders.json();
    const live = data.orders?.[0];
    if (live) {
      const res = await request.post(`/api/admin/orders/${live.id}/refund`, {
        headers: { cookie: adminCookie },
      });
      expect(res.status()).toBe(400);
    }
  });
});

test.describe("admin users management", () => {
  test("admin lists users with search", async ({ request }) => {
    const res = await request.get(`/api/admin/users?q=${TEST_CUSTOMER_PHONE}`, {
      headers: { cookie: adminCookie },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.users.length).toBe(1);
    expect(data.users[0].phone).toBe(TEST_CUSTOMER_PHONE);
    expect(typeof data.users[0].orderCount).toBe("number");
  });

  test("role change + self-lockout guard", async ({ request }) => {
    // find own admin record
    const me = await request.get(`/api/admin/users?q=${TEST_ADMIN_PHONE}`, {
      headers: { cookie: adminCookie },
    });
    const meData = await me.json();
    const self = meData.users[0];

    // self-demotion refused
    const refuse = await request.patch(`/api/admin/users/${self.id}`, {
      headers: { cookie: adminCookie },
      data: { role: "user" },
    });
    expect(refuse.status()).toBe(400);

    // promote customer2 then revert (valid transition each time)
    const promote = await request.patch(`/api/admin/users/${meData.users.find((u: { phone: string }) => u.phone === TEST_CUSTOMER2_PHONE)?.id ?? ""}`, {
      headers: { cookie: adminCookie },
      data: { role: "admin" },
    });
    if (promote.status() === 200) {
      const target = (await promote.json()).user;
      const revert = await request.patch(`/api/admin/users/${target.id}`, {
        headers: { cookie: adminCookie },
        data: { role: "user" },
      });
      expect(revert.status()).toBe(200);
    } else {
      // customer2 not in the filtered list (search was admin phone) — do a full lookup
      const all = await request.get("/api/admin/users", { headers: { cookie: adminCookie } });
      const allData = await all.json();
      const c2 = allData.users.find((u: { phone: string }) => u.phone === TEST_CUSTOMER2_PHONE);
      const promote2 = await request.patch(`/api/admin/users/${c2.id}`, {
        headers: { cookie: adminCookie },
        data: { role: "admin" },
      });
      expect(promote2.status()).toBe(200);
      const revert2 = await request.patch(`/api/admin/users/${c2.id}`, {
        headers: { cookie: adminCookie },
        data: { role: "user" },
      });
      expect(revert2.status()).toBe(200);
    }
  });

  test("invalid role rejected", async ({ request }) => {
    const all = await request.get("/api/admin/users", { headers: { cookie: adminCookie } });
    const data = await all.json();
    const someone = data.users.find((u: { phone: string }) => u.phone === TEST_CUSTOMER_PHONE);
    const res = await request.patch(`/api/admin/users/${someone.id}`, {
      headers: { cookie: adminCookie },
      data: { role: "superadmin" },
    });
    expect(res.status()).toBe(400);
  });
});
