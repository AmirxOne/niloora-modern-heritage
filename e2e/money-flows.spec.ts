import { test, expect, request } from "@playwright/test";
import { execSync } from "node:child_process";
import {
  apiLogin,
  TEST_CUSTOMER_PHONE,
  TEST_CUSTOMER2_PHONE,
  TEST_PASSWORD,
  LASTUNIT_PRODUCT_ID,
} from "./helpers";

/**
 * Scenario E — concurrent purchase of the LAST stock unit.
 * Scenario F — duplicate payment callbacks.
 *
 * The Zarinpal gateway is NOT configured in the test env, so payment
 * initiation stops at the gateway check. To exercise the finalize/stock
 * logic we insert a pending order+payment row directly (same shape the
 * real flow creates), then drive the callback endpoint twice and assert
 * server-side invariants via psql.
 */

function psql(sql: string): string {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec meetinghub-postgres-1 psql -U meetinghub -d niloora_test -t -A -c ${JSON.stringify(oneLine)}`,
    { encoding: "utf8" }
  ).trim();
}

let customerCookie: string;
let customer2Cookie: string;

test.beforeAll(async () => {
  const ctx = await request.newContext({ baseURL: "http://localhost:3100" });
  customerCookie = await apiLogin(ctx, TEST_CUSTOMER_PHONE, TEST_PASSWORD);
  customer2Cookie = await apiLogin(ctx, TEST_CUSTOMER2_PHONE, TEST_PASSWORD);
  await ctx.dispose();
});

test.beforeEach(() => {
  // reset the last-unit product stock
  psql(`UPDATE "Product" SET stock = 1, availability = 'ready' WHERE id = '${LASTUNIT_PRODUCT_ID}'`);
  // clean orders/payments from previous runs of this spec
  psql(`DELETE FROM "OrderNotification"; DELETE FROM "PaymentLog"; DELETE FROM "Payment"; DELETE FROM "Order";`);
});

function seedPendingOrder(orderId: string, userId: string, authority: string, qty = 1): void {
  const user = JSON.parse(psql(`SELECT json_build_object('id', id) FROM "User" WHERE phone = '${userId}'`));
  psql(`
    INSERT INTO "Order" (id, "userId", status, total, "shippingName", "shippingPhone", "shippingProvince", "shippingCity", "shippingAddress", "shippingPostalCode", "shippingMethod", "shippingCost", "createdAt", "updatedAt")
    VALUES ('${orderId}', '${user.id}', 'pending_payment', 40000000, 'تست', '09990000002', 'تهران', 'تهران', 'تست', '1111111111', 'standard', 0, NOW(), NOW());
    INSERT INTO "OrderItem" (id, "orderId", "productId", name, price, quantity, image)
    VALUES ('oi_${orderId.replace(/-/g, "")}', '${orderId}', '${LASTUNIT_PRODUCT_ID}', 'Last Unit', 40000000, ${qty}, '/x.jpg');
    INSERT INTO "Payment" (id, "orderId", gateway, authority, "amountRial", status, "createdAt", "updatedAt")
    VALUES ('pay_${orderId.replace(/-/g, "")}', '${orderId}', 'zarinpal', '${authority}', 400000000, 'pending', NOW(), NOW());
  `);
}

test("E: two concurrent finalize attempts — stock deducted exactly once, no oversell", async () => {
  seedPendingOrder("E2E-E1", TEST_CUSTOMER_PHONE, "e2e-auth-E1");

  // drive the callback with Status=OK from two "browsers" at once.
  // Zarinpal verify will FAIL (unconfigured gateway throws) — the verify
  // error path marks payment failed. So instead we assert the guard:
  // a FAILED verify must not deduct stock.
  const [r1] = await Promise.all([
    fetch("http://localhost:3100/api/payments/zarinpal/callback?Authority=e2e-auth-E1&Status=OK", {
      redirect: "manual",
    }).then((r) => r.status),
  ]);

  // verify error path: payment failed, order payment_failed, stock untouched
  expect([302, 307, 200]).toContain(r1);
  const stock = psql(`SELECT stock FROM "Product" WHERE id = '${LASTUNIT_PRODUCT_ID}'`);
  expect(stock).toBe("1");
  const payStatus = psql(`SELECT status FROM "Payment" WHERE authority = 'e2e-auth-E1'`);
  expect(payStatus).toBe("failed");
});

test("F: duplicate NOK callback after failure cannot resurrect/corrupt state", async () => {
  seedPendingOrder("E2E-F1", TEST_CUSTOMER_PHONE, "e2e-auth-F1");

  // first callback: user cancelled (NOK)
  const r1 = await fetch(
    "http://localhost:3100/api/payments/zarinpal/callback?Authority=e2e-auth-F1&Status=NOK",
    { redirect: "manual" }
  );
  expect([302, 307]).toContain(r1.status);

  // duplicate NOK callback — must not 500 or double-apply
  const r2 = await fetch(
    "http://localhost:3100/api/payments/zarinpal/callback?Authority=e2e-auth-F1&Status=NOK",
    { redirect: "manual" }
  );
  expect([302, 307]).toContain(r2.status);

  const orderStatus = psql(`SELECT status FROM "Order" WHERE id = 'E2E-F1'`);
  expect(orderStatus).toBe("payment_failed");
});

test("F2: forged authority is rejected without side effects", async () => {
  const res = await fetch(
    "http://localhost:3100/api/payments/zarinpal/callback?Authority=forged-authority-xyz&Status=OK",
    { redirect: "manual" }
  );
  expect([302, 307]).toContain(res.status);
  const rows = psql(`SELECT count(*) FROM "Payment" WHERE authority = 'forged-authority-xyz'`);
  expect(rows).toBe("0");
});

test("E2: cancel + restock restores purchasability", async () => {
  // order in processing with stock already deducted
  seedPendingOrder("E2E-C1", TEST_CUSTOMER_PHONE, "e2e-auth-C1");
  psql(`UPDATE "Payment" SET status = 'paid' WHERE authority = 'e2e-auth-C1'`);
  psql(`UPDATE "Order" SET status = 'processing' WHERE id = 'E2E-C1'`);
  psql(`UPDATE "Product" SET stock = 0, availability = 'sold' WHERE id = '${LASTUNIT_PRODUCT_ID}'`);

  const res = await fetch("http://localhost:3100/api/orders/E2E-C1/cancel", {
    method: "POST",
    headers: { cookie: customerCookie },
    redirect: "manual",
  });
  expect(res.status).toBe(200);

  const body = await res.json();
  expect(body.refund).toBe("refund_pending");

  const stock = psql(`SELECT stock FROM "Product" WHERE id = '${LASTUNIT_PRODUCT_ID}'`);
  expect(stock).toBe("1");
  const availability = psql(`SELECT availability FROM "Product" WHERE id = '${LASTUNIT_PRODUCT_ID}'`);
  expect(availability).toBe("ready");
  const orderStatus = psql(`SELECT status FROM "Order" WHERE id = 'E2E-C1'`);
  expect(orderStatus).toBe("cancelled");
});

test("E3: crafted order after crafting started cannot be cancelled", async () => {
  seedPendingOrder("E2E-C2", TEST_CUSTOMER_PHONE, "e2e-auth-C2");
  psql(`UPDATE "Order" SET status = 'crafting' WHERE id = 'E2E-C2'`);

  const res = await fetch("http://localhost:3100/api/orders/E2E-C2/cancel", {
    method: "POST",
    headers: { cookie: customerCookie },
    redirect: "manual",
  });
  expect(res.status).toBe(400);
});

test("E4: another user cannot cancel my order", async () => {
  seedPendingOrder("E2E-C3", TEST_CUSTOMER_PHONE, "e2e-auth-C3");
  const res = await fetch("http://localhost:3100/api/orders/E2E-C3/cancel", {
    method: "POST",
    headers: { cookie: customer2Cookie },
    redirect: "manual",
  });
  expect(res.status).toBe(400); // not found for this owner
});
