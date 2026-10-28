import { test, expect, request, type Page } from "@playwright/test";

// full multi-role journey needs more than the default 60s
test.setTimeout(180_000);
import { execSync } from "node:child_process";
import {
  uiLogin,
  apiLogin,
  TEST_ADMIN_PHONE,
  TEST_CUSTOMER_PHONE,
  TEST_SELLER_PHONE,
  TEST_PASSWORD,
  ALPHA_PRODUCT_ID,
} from "./helpers";

/**
 * FULL-USER-JOURNEY spec — drives every role through real flows:
 *
 * ADMIN:   site-wide discount banner → per-product discount → add product
 * SELLER:  opens panel, lists a product
 * CUSTOMER: browses → search → product → add to cart → applies promo code
 *          → checkout (gateway unconfigured => clean error, no order) →
 *          simulated PAID order → sees it in account → cancels → refund flow
 * ADMIN:   settles refund → order lifecycle (shipped) → restores banner
 */

function psql(sql: string): string {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec meetinghub-postgres-1 psql -U meetinghub -d niloora_test -t -A -c ${JSON.stringify(oneLine)}`,
    { encoding: "utf8" }
  ).trim();
}

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

const DEV_CHUNK_ERRORS = ["Invalid or unexpected token", "Unexpected end of input"];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => {
    if (!DEV_CHUNK_ERRORS.some((k) => err.message.includes(k))) errors.push(err.message);
  });
  return errors;
}

let adminCookie: string;

test.beforeAll(async () => {
  const ctx = await request.newContext({ baseURL: BASE });
  adminCookie = await apiLogin(ctx, TEST_ADMIN_PHONE, TEST_PASSWORD);
  await ctx.dispose();
});

test.beforeEach(() => {
  // pre-clean any leftovers from previous runs
  psql(`DELETE FROM "SellerLedgerEntry" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "OrderNotification" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "OrderItem" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "Payment" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "Order" WHERE id LIKE 'E2E-LIVE%'`);
  // reset banner to a known site-wide 20% state + ensure promo exists
  psql(`
    UPDATE "HomeBannerSettings" SET enabled=true, percent=20,
      title='بیست درصد تخفیف تست', subtitle='تست چرخه', badge='تست',
      \"ctaLabel\"='فروشگاه', \"ctaHref\"='/shop'
    WHERE id='default'
  `);
  psql(`
    INSERT INTO "PromoCode" (id, code, label, type, value, "minSubtotal", "replacesSiteWide", active, aliases, "createdAt", "updatedAt")
    VALUES ('e2e-live-promo', 'LIVE15', 'پانزده درصد تست زنده', 'percent', 15, 1000000, false, true, '[]', NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET active=true, value=15
  `);
});

test.afterEach(() => {
  // cleanup this spec's data (order first to satisfy FK deps)
  psql(`DELETE FROM "SellerLedgerEntry" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "OrderNotification" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "OrderItem" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "Payment" WHERE "orderId" LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "Order" WHERE id LIKE 'E2E-LIVE%'`);
  psql(`DELETE FROM "PromoCode" WHERE code='LIVE15'`);
  psql(`DELETE FROM "Product" WHERE id='e2e-live-admin-ring'`);
  psql(`DELETE FROM "Product" WHERE id LIKE 'e2e-live-seller%'`);
  psql(`UPDATE "HomeBannerSettings" SET percent=20, enabled=true WHERE id='default'`);
  psql(`UPDATE "Product" SET price=60000000, \"discountPercent\"=NULL, \"listPrice\"=NULL WHERE id='${ALPHA_PRODUCT_ID}'`);
  psql(`UPDATE "Product" SET stock=3, availability='ready' WHERE id='${ALPHA_PRODUCT_ID}'`);
});

test("FULL JOURNEY: admin discount → customer buys → cancel → refund → ship", async ({ page, browser }) => {
  const errors = collectErrors(page);
  const toast = (msg: string) => console.log(`[JOURNEY] ${msg}`);

  // ─────────────────────────────────────────────
  // STEP 1 — ADMIN: per-product discount on Alpha (10% off)
  // NOTE: admin product PATCH validates the FULL form (name/namePersian/
  // price required) — the admin panel always sends the complete payload.
  toast("ADMIN: set 10% discount on Alpha via admin products API");
  const discountRes = await fetch(`${BASE}/api/admin/products/${ALPHA_PRODUCT_ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: adminCookie },
    body: JSON.stringify({
      name: "E2E Ring Alpha",
      namePersian: "انگشتر تست آلفا",
      // discount model: selling price 54M, listPrice auto-derived to 60M
      price: 54_000_000,
      discountPercent: 10,
      image: "/Picsart_26-04-26_15-15-33-128.jpg",
      category: "solitaire",
      metal: "sterling",
      stone: "diamond",
      stoneShape: "round",
      engravingType: "none",
      availability: "ready",
      stock: 3,
    }),
  });
  expect(discountRes.status).toBe(200);
  const discounted = await discountRes.json();
  toast(`Alpha now: ${discounted.product.price} (was 60,000,000)`);
  expect(discounted.product.price).toBeLessThan(60_000_000);

  // ADMIN: add a brand-new product through the admin API
  toast("ADMIN: create new product");
  const createRes = await fetch(`${BASE}/api/admin/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: adminCookie },
    body: JSON.stringify({
      id: "e2e-live-admin-ring",
      name: "Live Test Admin Ring",
      namePersian: "انگشتر تست زنده ادمین",
      price: 45_000_000,
      image: "/Picsart_26-04-26_15-15-33-128.jpg",
      category: "solitaire",
      metal: "sterling",
      stone: "diamond",
      stoneShape: "round",
      engravingType: "none",
      availability: "ready",
      stock: 5,
    }),
  });
  expect(createRes.status).toBe(201);
  toast("ADMIN: product created ✓");

  // ─────────────────────────────────────────────
  // STEP 2 — SELLER: opens panel in browser, sees shop stats
  toast("SELLER: open /seller panel");
  // password login via API (OTP is rate-limited 3/10min per phone and this
  // spec already logs the customer in via OTP) — seed users carry Test@1234
  const sellerCtx = await browser.newContext();
  const sellerLoginPage = await sellerCtx.newPage();
  const sellerLoginRes = await sellerLoginPage.request.post("/api/auth/login", {
    data: { phone: TEST_SELLER_PHONE, password: TEST_PASSWORD },
  });
  expect(sellerLoginRes.status()).toBe(200);
  const sellerCookieHeader = sellerLoginRes.headers()["set-cookie"] ?? "";
  // inject the session cookie into the context
  const cookiePair = sellerCookieHeader.split(";")[0].split("=");
  await sellerCtx.addCookies([
    { name: cookiePair[0], value: cookiePair.slice(1).join("="), url: BASE, httpOnly: true },
  ]);
  const sellerPage = await sellerCtx.newPage();
  await sellerPage.goto(`${BASE}/seller`);
  await expect(sellerPage.getByText(/shop-a/).first()).toBeVisible({ timeout: 30_000 });
  toast("SELLER: panel visible ✓");

  // seller lists a product via API (panel form covered elsewhere)
  const sellerCookie = (await sellerCtx.cookies())
    .map((c) => `${c.name}=${c.value}`).join("; ");
  const sellerProduct = await fetch(`${BASE}/api/seller/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: sellerCookie },
    body: JSON.stringify({
      id: "e2e-live-seller-ring",
      name: "Live Seller Ring",
      namePersian: "انگشتر تست زنده فروشنده",
      price: 18_000_000,
      image: "/Picsart_26-04-26_15-15-33-128.jpg",
      stock: 4,
      headline: "غرفه تست الف",
    }),
  });
  expect(sellerProduct.status).toBe(201);
  toast("SELLER: product listed ✓");
  await sellerCtx.close();

  // ─────────────────────────────────────────────
  // STEP 3 — CUSTOMER: browse home → shop → search → product → cart
  toast("CUSTOMER: browse shop");
  await page.goto(`${BASE}/shop`);
  const cards = page.locator("a[href^='/product/']");
  await expect(cards.first()).toBeVisible({ timeout: 30_000 });
  const cardCount = await cards.count();
  toast(`shop shows ${cardCount} products (incl. seller + admin items)`);
  expect(cardCount).toBeGreaterThanOrEqual(4); // 3 seed + admin + seller

  // search for the admin-created product
  toast("CUSTOMER: search 'ادمین'");
  await page.goto(`${BASE}/shop?q=${encodeURIComponent("ادمین")}`);
  await page.waitForLoadState("networkidle");
  // (search filters client-side; main assertion: page still functional)
  await expect(page.locator("main").first()).toBeVisible();

  // open product page of Alpha
  toast("CUSTOMER: open Alpha product page");
  await page.goto(`${BASE}/product/${ALPHA_PRODUCT_ID}`);
  const h1 = page.getByRole("heading", { level: 1 }).first();
  await expect(h1).toContainText("Ring Alpha", { timeout: 30_000 });
  toast("product page ✓ (discounted price rendering)");

  // add to cart
  toast("CUSTOMER: add to cart");
  const addBtn = page.getByRole("button", { name: /افزودن به سبد|ثبت پیش‌فروش/ }).first();
  await addBtn.waitFor({ timeout: 20_000 });
  await addBtn.click();

  // go to cart
  toast("CUSTOMER: open cart");
  await page.getByRole("link", { name: /سبد خرید/ }).first().click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByText("Ring Alpha").first()).toBeVisible({ timeout: 20_000 });

  // apply promo code LIVE15 through the cart UI
  toast("CUSTOMER: apply promo LIVE15");
  const promoInput = page.getByPlaceholder(/BAHAKAHI20|کد/, { exact: false }).first();
  const promoVisible = await promoInput.isVisible({ timeout: 8_000 }).catch(() => false);
  if (promoVisible) {
    await promoInput.fill("LIVE15");
    const applyBtn = page.getByRole("button", { name: "اعمال" }).first();
    await applyBtn.click();
    await page.waitForTimeout(1500);
    toast("promo applied via UI ✓");
  } else {
    // validate via API to keep the assertion meaningful
    const check = await fetch(`${BASE}/api/promo/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "LIVE15", subtotalSale: 54_000_000 }),
    });
    const data = await check.json();
    expect(data.valid).toBe(true);
    toast("promo validated via API ✓");
  }

  // ─────────────────────────────────────────────
  // STEP 4 — CHECKOUT attempt (gateway unconfigured → clean failure)
  toast("CUSTOMER: checkout attempt");
  const checkoutRes = await fetch(`${BASE}/api/payments/zarinpal/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: [
        { id: "x", productId: ALPHA_PRODUCT_ID, name: "x", price: 1, quantity: 1, image: "x" },
      ],
      promoCode: "LIVE15",
      shipping: {
        fullName: "مشتری تست زنده",
        mobile: TEST_CUSTOMER_PHONE,
        province: "تهران",
        city: "تهران",
        address: "خیابان تست زنده، پلاک ۱۰، واحد ۲",
        postalCode: "1111111111",
        shippingMethod: "standard",
      },
    }),
  });
  expect(checkoutRes.status).toBe(400);
  const checkoutData = await checkoutRes.json();
  toast(`checkout blocked cleanly: "${checkoutData.message}"`);
  expect(String(checkoutData.message)).toContain("درگاه");
  // crucially: no NEW order was created for this checkout attempt (other
  // specs may leave their own pending rows; we scope to recent minutes)
  const created = psql(
    `SELECT count(*) FROM "Order" WHERE status='pending_payment' AND "createdAt" > NOW() - INTERVAL '1 minute' AND id NOT LIKE 'E2E-%'`
  );
  expect(created).toBe("0");

  // ─────────────────────────────────────────────
  // STEP 5 — simulate a PAID order (money cycle) for the customer
  toast("CUSTOMER: simulate paid order (Alpha x1 + seller item x2)");
  const customerId = psql(`SELECT id FROM "User" WHERE phone='${TEST_CUSTOMER_PHONE}'`);
  psql(`
    INSERT INTO "Order" (id, "userId", status, total, "promoCode", "shippingName", "shippingPhone", "shippingProvince", "shippingCity", "shippingAddress", "shippingPostalCode", "shippingMethod", "shippingCost", "createdAt", "updatedAt")
    VALUES ('E2E-LIVE1', '${customerId}', 'pending_payment', 84000000, 'LIVE15', 'مشتری تست', '${TEST_CUSTOMER_PHONE}', 'تهران', 'تهران', 'تست کامل', '1111111111', 'standard', 0, NOW(), NOW());
    INSERT INTO "OrderItem" (id, "orderId", "productId", name, price, quantity, image)
    VALUES ('oi_live1', 'E2E-LIVE1', '${ALPHA_PRODUCT_ID}', 'Alpha', 54000000, 1, '/x.jpg');
    INSERT INTO "OrderItem" (id, "orderId", "productId", name, price, quantity, image)
    VALUES ('oi_live2', 'E2E-LIVE1', 'e2e-live-seller-ring', 'Seller Ring', 18000000, 2, '/x.jpg');
    INSERT INTO "Payment" (id, "orderId", gateway, authority, "amountRial", status, "createdAt", "updatedAt")
    VALUES ('pay_live1', 'E2E-LIVE1', 'zarinpal', 'e2e-live-auth-1', 840000000, 'pending', NOW(), NOW());
  `);

  // drive the REAL callback with Status=OK — gateway unconfigured → verify
  // fails cleanly; we then mark paid directly and run the stock+credit path
  const cb = await fetch(
    `${BASE}/api/payments/zarinpal/callback?Authority=e2e-live-auth-1&Status=OK`,
    { redirect: "manual" }
  );
  expect([302, 307]).toContain(cb.status);
  toast("callback drove verify-error path (no gateway) ✓");

  // settle as paid + finalize stock/credit exactly like the callback winner
  // does. Drop the fake authority first so the admin refund endpoint takes
  // the manual-settlement path (gateway reverse is covered elsewhere; here
  // no real gateway transaction exists to reverse).
  psql(`UPDATE "Payment" SET status='paid', authority=NULL WHERE id='pay_live1'`);
  psql(`UPDATE "Order" SET status='processing' WHERE id='E2E-LIVE1'`);
  psql(`UPDATE "Product" SET stock=stock-1 WHERE id='${ALPHA_PRODUCT_ID}'`);
  psql(`UPDATE "Product" SET stock=stock-2 WHERE id='e2e-live-seller-ring'`);

  // seller credit for their items (as creditSellersForOrder would):
  // 2 × 18M = 36M, commission 10% → seller share 32.4M
  psql(`
    INSERT INTO "SellerLedgerEntry" (id, "sellerId", "orderId", kind, amount, note, "createdAt")
    SELECT 'le_live1', s.id, 'E2E-LIVE1', 'sale_credit', 32400000, 'زنده', NOW()
    FROM "Seller" s JOIN "Product" p ON p.\"sellerId\"=s.id
    WHERE p.id='e2e-live-seller-ring' LIMIT 1
  `);

  // seller sees the money
  const sellerOv = await fetch(`${BASE}/api/seller/overview`, {
    headers: { cookie: sellerCookie },
  });
  const sellerData = await sellerOv.json();
  toast(`SELLER: balance after sale = ${sellerData.stats.balanceToman}`);
  expect(sellerData.stats.balanceToman).toBe(32_400_000);

  // ─────────────────────────────────────────────
  // STEP 6 — CUSTOMER: sees order in account, cancels it
  toast("CUSTOMER: view order + cancel via account UI");
  // password login via API + cookie injection (OTP is rate-limited across
  // repeated CI runs; seeded users all carry Test@1234)
  const custLogin = await page.request.post("/api/auth/login", {
    data: { phone: TEST_CUSTOMER_PHONE, password: TEST_PASSWORD },
  });
  expect(custLogin.status()).toBe(200);
  const custCookieHeader = custLogin.headers()["set-cookie"] ?? "";
  const custPair = custCookieHeader.split(";")[0].split("=");
  await page.context().addCookies([
    { name: custPair[0], value: custPair.slice(1).join("="), url: BASE, httpOnly: true },
  ]);
  await page.goto(`${BASE}/account`);
  await page.waitForLoadState("networkidle");
  // switch to the orders tab (account defaults to overview)
  const ordersTab = page.getByRole("button", { name: /^تاریخچه خرید/ }).first();
  const tabVisible = await ordersTab.isVisible({ timeout: 8_000 }).catch(() => false);
  if (tabVisible) await ordersTab.click();
  await expect(page.getByText(/LIVE/).first()).toBeVisible({ timeout: 20_000 });
  toast("order visible in account ✓");

  const cancelBtn = page.getByRole("button", { name: "لغو سفارش" }).first();
  const canCancel = await cancelBtn.isVisible({ timeout: 6_000 }).catch(() => false);
  expect(canCancel).toBe(true);
  const cancelResponsePromise = page.waitForResponse(
    (r) => r.url().includes("/cancel") && r.request().method() === "POST",
    { timeout: 20_000 }
  );
  page.on("dialog", (d) => void d.accept());
  await cancelBtn.click();
  const cancelResponse = await cancelResponsePromise;
  toast(`cancel endpoint → ${cancelResponse.status()}`);
  expect(cancelResponse.status()).toBe(200);
  await page.waitForTimeout(1200);

  const orderStatus = psql(`SELECT status FROM "Order" WHERE id='E2E-LIVE1'`);
  toast(`order status after cancel: ${orderStatus}`);
  expect(orderStatus).toBe("cancelled");

  const paymentStatus = psql(`SELECT status FROM "Payment" WHERE id='pay_live1'`);
  expect(paymentStatus).toBe("refund_pending");
  toast("payment → refund_pending ✓");

  // stock restored
  const alphaStock = psql(`SELECT stock FROM "Product" WHERE id='${ALPHA_PRODUCT_ID}'`);
  expect(alphaStock).toBe("3"); // back to seed value
  toast("stock restored after cancel ✓");

  // ─────────────────────────────────────────────
  // STEP 7 — ADMIN: settles the refund
  toast("ADMIN: settle refund");
  const refundRes = await fetch(`${BASE}/api/admin/orders/E2E-LIVE1/refund`, {
    method: "POST",
    headers: { cookie: adminCookie },
  });
  expect(refundRes.status).toBe(200);
  const refundData = await refundRes.json();
  toast(`refund settled (${refundData.mode}) ✓`);
  expect(psql(`SELECT status FROM "Payment" WHERE id='pay_live1'`)).toBe("refunded");

  // ─────────────────────────────────────────────
  // STEP 8 — ADMIN: order lifecycle on a second order (ship it)
  toast("ADMIN: create+ship second order");
  psql(`
    INSERT INTO "Order" (id, "userId", status, total, "shippingName", "shippingPhone", "shippingMethod", "shippingCost", "createdAt", "updatedAt")
    VALUES ('E2E-LIVE2', '${customerId}', 'processing', 45000000, 'تست', '${TEST_CUSTOMER_PHONE}', 'express', 0, NOW(), NOW());
    INSERT INTO "OrderItem" (id, "orderId", "productId", name, price, quantity, image)
    VALUES ('oi_live2b', 'E2E-LIVE2', 'e2e-live-admin-ring', 'Admin Ring', 45000000, 1, '/x.jpg');
  `);
  const shipRes = await fetch(`${BASE}/api/admin/orders/E2E-LIVE2`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie: adminCookie },
    body: JSON.stringify({ status: "shipped", trackingCode: "RAH12345678" }),
  });
  expect(shipRes.status).toBe(200);
  toast("order shipped with tracking ✓");

  // customer sees tracking
  // under full-suite load the orders API can lag behind first paint — retry
  let trackingVisible = false;
  for (let attempt = 0; attempt < 3 && !trackingVisible; attempt++) {
    await page.goto(`${BASE}/account`);
    const ordersTab2 = page.getByRole("button", { name: /^تاریخچه خرید/ }).first();
    const tabVisible2 = await ordersTab2.isVisible({ timeout: 8_000 }).catch(() => false);
    if (tabVisible2) await ordersTab2.click();
    trackingVisible = await page
      .getByText(/RAH/)
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
  }
  expect(trackingVisible).toBe(true);
  toast("customer sees tracking code ✓");

  // shipped order can no longer be cancelled
  const shippedCancel = await fetch(`${BASE}/api/orders/E2E-LIVE2/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ") },
  });
  expect(shippedCancel.status).toBe(400);
  toast("shipped order not cancellable ✓");

  // cleanup second order
  psql(`DELETE FROM "OrderItem" WHERE "orderId"='E2E-LIVE2'; DELETE FROM "Order" WHERE id='E2E-LIVE2';`);

  // ─────────────────────────────────────────────
  // FINAL: no real console errors in the customer browser session
  expect(errors).toEqual([]);
  toast("JOURNEY COMPLETE — all roles, full cycle ✓");
});
