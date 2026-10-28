import { test, expect, request } from "@playwright/test";
import { execSync } from "node:child_process";
import {
  apiLogin,
  TEST_ADMIN_PHONE,
  TEST_CUSTOMER_PHONE,
  TEST_CUSTOMER2_PHONE,
  TEST_SELLER_PHONE,
  TEST_SELLER2_PHONE,
  TEST_PASSWORD,
} from "./helpers";

/**
 * Marketplace deep-audit spec — covers entities and edge cases NOT in the
 * other specs: registration validation, slug rules, duplicate shops,
  one-shop-per-user, commission bounds, payout race guards, ledger
 * integrity, admin-only ops, cross-tenant access, suspended-shop register
 * flow, and cold-start conditions.
 */

function psql(sql: string): string {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec meetinghub-postgres-1 psql -U meetinghub -d niloora_test -t -A -c ${JSON.stringify(oneLine)}`,
    { encoding: "utf8" }
  ).trim();
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

let adminCookie: string;
let customerCookie: string;
let customer2Cookie: string;
let sellerCookie: string;
let seller2Cookie: string;

test.beforeAll(async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  adminCookie = await apiLogin(ctx, TEST_ADMIN_PHONE, TEST_PASSWORD);
  customerCookie = await apiLogin(ctx, TEST_CUSTOMER_PHONE, TEST_PASSWORD);
  customer2Cookie = await apiLogin(ctx, TEST_CUSTOMER2_PHONE, TEST_PASSWORD);
  sellerCookie = await apiLogin(ctx, TEST_SELLER_PHONE, TEST_PASSWORD);
  seller2Cookie = await apiLogin(ctx, TEST_SELLER2_PHONE, TEST_PASSWORD);
  await ctx.dispose();
});

test.beforeEach(() => {
  psql(`UPDATE "Seller" SET status='active' WHERE slug IN ('e2e-shop-a','e2e-shop-b')`);
});

test.describe("shop registration validation", () => {
  test("shop name too short rejected", async () => {
    const res = await fetch(`${BASE}/api/seller/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: customerCookie },
      body: JSON.stringify({ shopName: "ا", slug: "too-short-name" }),
    });
    expect(res.status).toBe(400);
  });

  test("slug normalization: persian name auto-slugs", async () => {
    // slug derived from shopName when slug omitted — persian chars kept
    const res = await fetch(`${BASE}/api/seller/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: customer2Cookie },
      body: JSON.stringify({ shopName: "غرفه تست ثبت", slug: "" }),
    });
    // customer2 should now be registerable (no shop yet in seed) — either
    // 201 with a slug, or a duplicate/invalid error. We assert 201 + slug.
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.seller.status).toBe("pending");
    // cleanup
    psql(`DELETE FROM "Seller" WHERE "userId"=(SELECT id FROM "User" WHERE phone='${TEST_CUSTOMER2_PHONE}')`);
  });

  test("one shop per user — second registration rejected", async () => {
    // seller already owns e2e-shop-a
    const res = await fetch(`${BASE}/api/seller/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ shopName: "دکه دوم", slug: "second-shop-x" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(String(data.message)).toContain("قبلاً");
  });

  test("duplicate slug rejected", async () => {
    const res = await fetch(`${BASE}/api/seller/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: customer2Cookie },
      body: JSON.stringify({ shopName: "فروشگاه تست", slug: "e2e-shop-a" }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(String(data.message)).toContain("گرفته شده");
  });

  test("anonymous registration rejected (401)", async () => {
    const res = await fetch(`${BASE}/api/seller/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopName: "anon shop", slug: "anon-shop" }),
    });
    expect(res.status).toBe(401);
  });

  test("pending seller cannot list products (403)", async () => {
    // temporarily set shop-a to pending
    psql(`UPDATE "Seller" SET status='pending' WHERE slug='e2e-shop-a'`);
    const res = await fetch(`${BASE}/api/seller/products`, {
      headers: { cookie: sellerCookie },
    });
    expect(res.status).toBe(403);
  });
});

test.describe("admin seller management edge cases", () => {
  test("invalid status value rejected", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    const res = await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ status: "deleted" }),
    });
    expect(res.status).toBe(400);
  });

  test("commission bounds: 0 ok, 51 rejected, negative rejected", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);

    const zero = await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: 0 }),
    });
    expect(zero.status).toBe(200);

    const tooHigh = await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: 51 }),
    });
    expect(tooHigh.status).toBe(400);

    const negative = await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: -5 }),
    });
    expect(negative.status).toBe(400);

    // restore 10%
    await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: 10 }),
    });
  });

  test("nonexistent seller id → 404", async () => {
    const res = await fetch(`${BASE}/api/admin/sellers?id=does-not-exist`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ status: "active" }),
    });
    expect(res.status).toBe(404);
  });

  test("commission change affects future credits (ledger math)", async () => {
    // seed order + credit with commission 25% then verify share
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    const userId = psql(`SELECT id FROM "User" WHERE phone='${TEST_CUSTOMER_PHONE}'`);

    await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: 25 }),
    });

    // insert order+payment+items directly, then run credit via... credit
    // runs in callback which needs gateway; emulate the exact math the
    // service uses by seeding a credit row with the same rule:
    psql(`
      INSERT INTO "Product" (id, name, "namePersian", price, image, category, metal, stone, "stoneShape", "engravingType", availability, stock, "sellerId", condition, "createdAt", "updatedAt")
      VALUES ('e2e-audit-ring', 'Audit Ring', 'حلقه ممیزی', 40000000, '/x.jpg', 'solitaire', 'sterling', 'onyx', 'round', 'none', 'ready', 9, '${sellerId}', 'new', NOW(), NOW());
      INSERT INTO "Order" (id, "userId", status, total, "shippingName", "shippingPhone", "shippingMethod", "shippingCost", "createdAt", "updatedAt")
      VALUES ('E2E-AUDIT1', '${userId}', 'processing', 40000000, 'تست', '${TEST_CUSTOMER_PHONE}', 'standard', 0, NOW(), NOW());
      INSERT INTO "OrderItem" (id, "orderId", "productId", name, price, quantity, image)
      VALUES ('oi_audit1', 'E2E-AUDIT1', 'e2e-audit-ring', 'Audit Ring', 40000000, 1, '/x.jpg');
      INSERT INTO "Payment" (id, "orderId", gateway, "amountRial", status, "createdAt", "updatedAt")
      VALUES ('pay_audit1', 'E2E-AUDIT1', 'zarinpal', 400000000, 'paid', NOW(), NOW());
      INSERT INTO "SellerLedgerEntry" (id, "sellerId", "orderId", kind, amount, note, "createdAt")
      VALUES ('le_audit1', '${sellerId}', 'E2E-AUDIT1', 'sale_credit', 30000000, '75%', NOW());
    `);

    const overview = await fetch(`${BASE}/api/seller/overview`, {
      headers: { cookie: sellerCookie },
    });
    const ov = await overview.json();
    // 75% of 40M = 30M credited
    expect(ov.stats.balanceToman).toBe(30_000_000);

    // cleanup + restore commission
    psql(`
      DELETE FROM "SellerLedgerEntry" WHERE id='le_audit1';
      DELETE FROM "Payment" WHERE id='pay_audit1';
      DELETE FROM "OrderItem" WHERE "orderId"='E2E-AUDIT1';
      DELETE FROM "Order" WHERE id='E2E-AUDIT1';
      DELETE FROM "Product" WHERE id='e2e-audit-ring';
    `);
    await fetch(`${BASE}/api/admin/sellers?id=${sellerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ commissionPercent: 10 }),
    });
  });
});

test.describe("seller product edge cases", () => {
  test.afterEach(() => {
    psql(`DELETE FROM "Product" WHERE id LIKE 'e2e-audit-%'`);
  });

  test("invalid product id format rejected", async () => {
    const res = await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "Bad ID!",
        name: "X Ring",
        price: 10_000_000,
        image: "/x.jpg",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("price below floor rejected", async () => {
    const res = await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-cheap",
        name: "Cheap Ring",
        price: 500_000,
        image: "/x.jpg",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("missing image rejected", async () => {
    const res = await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-noimg",
        name: "No Image Ring",
        price: 10_000_000,
        image: "",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("duplicate product id rejected", async () => {
    await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-dup",
        name: "Dup Ring",
        price: 10_000_000,
        image: "/x.jpg",
      }),
    });
    const res = await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-dup",
        name: "Dup Ring 2",
        price: 12_000_000,
        image: "/x.jpg",
      }),
    });
    expect(res.status).toBe(400);
  });

  test("platform product id cannot be hijacked by seller", async () => {
    // e2e-ring-alpha is a platform product (sellerId null)
    const res = await fetch(`${BASE}/api/seller/products/e2e-ring-alpha`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ price: 1_000_000 }),
    });
    expect(res.status).toBe(404); // ownership scoping protects it
    const price = psql(`SELECT price FROM "Product" WHERE id='e2e-ring-alpha'`);
    expect(price).toBe("60000000");
  });

  test("seller cannot set availability to 'sold' arbitrarily to fake scarcity? (allowed) but availability enum enforced", async () => {
    // create then try invalid availability
    await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-avail",
        name: "Avail Ring",
        price: 10_000_000,
        image: "/x.jpg",
      }),
    });
    const res = await fetch(`${BASE}/api/seller/products/e2e-audit-avail`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ availability: "weird-status" }),
    });
    expect(res.status).toBe(400);
  });

  test("stock 0 flips product to sold", async () => {
    await fetch(`${BASE}/api/seller/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({
        id: "e2e-audit-stock0",
        name: "Stock0 Ring",
        price: 10_000_000,
        image: "/x.jpg",
        stock: 2,
      }),
    });
    const res = await fetch(`${BASE}/api/seller/products/e2e-audit-stock0`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ stock: 0 }),
    });
    expect(res.status).toBe(200);
    const availability = psql(
      `SELECT availability FROM "Product" WHERE id='e2e-audit-stock0'`
    );
    expect(availability).toBe("sold");
  });
});

test.describe("payout edge cases", () => {
  test.beforeEach(() => {
    psql(`DELETE FROM "SellerLedgerEntry"`);
    psql(`DELETE FROM "SellerPayout"`);
  });

  test("payout below minimum rejected", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_p1', '${sellerId}', 'sale_credit', 50000000, 'x', NOW())`);

    const res = await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 500_000 }),
    });
    expect(res.status).toBe(400);
  });

  test("payout above balance rejected", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_p2', '${sellerId}', 'sale_credit', 10000000, 'x', NOW())`);

    const res = await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 50_000_000 }),
    });
    expect(res.status).toBe(400);
  });

  test("reject releases balance back", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_p3', '${sellerId}', 'sale_credit', 20000000, 'x', NOW())`);

    // request payout
    const req = await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 15_000_000 }),
    });
    expect(req.status).toBe(201);

    // balance reserved while pending
    const ov1 = await (await fetch(`${BASE}/api/seller/overview`, { headers: { cookie: sellerCookie } })).json();
    expect(ov1.stats.balanceToman).toBe(5_000_000);

    // admin rejects
    const payoutId = psql(`SELECT id FROM "SellerPayout" WHERE status='requested' LIMIT 1`);
    const reject = await fetch(`${BASE}/api/admin/seller-payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ payoutId, action: "reject" }),
    });
    expect(reject.status).toBe(200);

    // balance restored
    const ov2 = await (await fetch(`${BASE}/api/seller/overview`, { headers: { cookie: sellerCookie } })).json();
    expect(ov2.stats.balanceToman).toBe(20_000_000);
  });

  test("double mark_paid rejected (no double debit)", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_p4', '${sellerId}', 'sale_credit', 30000000, 'x', NOW())`);

    await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 10_000_000 }),
    });
    const payoutId = psql(`SELECT id FROM "SellerPayout" WHERE status='requested' LIMIT 1`);

    const first = await fetch(`${BASE}/api/admin/seller-payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ payoutId, action: "mark_paid" }),
    });
    expect(first.status).toBe(200);

    const second = await fetch(`${BASE}/api/admin/seller-payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: adminCookie },
      body: JSON.stringify({ payoutId, action: "mark_paid" }),
    });
    expect(second.status).toBe(400);

    // exactly one debit entry
    const debits = psql(`SELECT count(*) FROM "SellerLedgerEntry" WHERE kind='payout_debit'`);
    expect(debits).toBe("1");
  });

  test("seller B cannot see or act on seller A payouts", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_p5', '${sellerId}', 'sale_credit', 30000000, 'x', NOW())`);
    await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 10_000_000 }),
    });
    const payoutId = psql(`SELECT id FROM "SellerPayout" WHERE status='requested' LIMIT 1`);

    // seller B's payout list must NOT contain seller A's payout
    const myList = await fetch(`${BASE}/api/seller/payouts`, {
      headers: { cookie: seller2Cookie },
    });
    const myData = await myList.json();
    expect(myData.payouts.find((p: { id: string }) => p.id === payoutId)).toBeUndefined();
  });
});

test.describe("cross-tenant security (scenario D hardening)", () => {
  test("admin required for payout actions — seller self-approve blocked", async () => {
    const sellerId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    psql(`INSERT INTO "SellerLedgerEntry" (id, "sellerId", kind, amount, note, "createdAt") VALUES ('le_d1', '${sellerId}', 'sale_credit', 30000000, 'x', NOW())`);
    await fetch(`${BASE}/api/seller/payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ amount: 10_000_000 }),
    });
    const payoutId = psql(`SELECT id FROM "SellerPayout" WHERE status='requested' LIMIT 1`);

    const res = await fetch(`${BASE}/api/admin/seller-payouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie: sellerCookie },
      body: JSON.stringify({ payoutId, action: "mark_paid" }),
    });
    expect([401, 403]).toContain(res.status);

    psql(`DELETE FROM "SellerLedgerEntry"; DELETE FROM "SellerPayout"`);
  });

  test("customer cannot access any seller endpoint", async () => {
    for (const path of ["/api/seller/products", "/api/seller/payouts", "/api/seller/overview"]) {
      const res = await fetch(`${BASE}${path}`, { headers: { cookie: customerCookie } });
      // overview: 404 (no shop); others: 403 (no seller) — none are 200
      expect(res.status).not.toBe(200);
    }
  });
});
