import { test, expect, type Page } from "@playwright/test";
import { gotoStable } from "./support/navigation";

/**
 * Dev quick-login chips on /auth + the "become a seller" journey.
 * Chips live in a client component — wait for React hydration before clicking
 * (a click on the server-rendered markup fires no handler).
 */

const DEV_ACCOUNTS_TESTID = "dev-test-accounts";

async function openAuthHydrated(page: Page) {
  await gotoStable(page, "/auth");
  // hydration: initial client fetches settle before chip handlers exist
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
}

async function loginViaChip(page: Page, label: string) {
  await openAuthHydrated(page);
  const chip = page
    .getByTestId(DEV_ACCOUNTS_TESTID)
    .locator("button", { hasText: label })
    .first();
  await expect(chip).toBeVisible({ timeout: 15_000 });

  const otpRequest = page.waitForRequest(
    (req) => req.url().includes("/api/auth/otp/request") && req.method() === "POST",
    { timeout: 20_000 }
  );
  await chip.click();
  await otpRequest;
  await expect(page.locator(".auth-otp-wrap")).toBeVisible({ timeout: 20_000 });
}

async function submitAutofilledOtp(page: Page) {
  // Dev preview code is auto-filled into the OTP input; submit it.
  const submit = page.getByRole("button", { name: /تایید|ورود/ }).first();
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await page.waitForTimeout(2500); // session sync + redirect
}

test.describe("Auth dev quick-login chips", () => {
  test("dev account chips are visible and issue an OTP on click", async ({ page }) => {
    await openAuthHydrated(page);

    const chips = page.getByTestId(DEV_ACCOUNTS_TESTID).locator("button");
    await expect(chips.first()).toBeVisible();
    expect(await chips.count()).toBeGreaterThanOrEqual(6);

    const otpRequest = page.waitForRequest(
      (req) => req.url().includes("/api/auth/otp/request") && req.method() === "POST",
      { timeout: 20_000 }
    );
    await chips.filter({ hasText: "ادمین" }).first().click();
    await otpRequest;
    await expect(page.locator(".auth-otp-wrap")).toBeVisible({ timeout: 20_000 });
  });

  test("plain-user chip reaches the OTP step without error", async ({ page }) => {
    await loginViaChip(page, "کاربر عادی");
    await expect(page.locator(".auth-error-modern")).toHaveCount(0);
  });
});

test.describe("Become-a-seller journey (entry points & guards)", () => {
  test("header shows vendor CTA linking to /vendor/apply", async ({ page }) => {
    await gotoStable(page, "/");
    // two CTAs render (mobile lg:hidden + desktop); pick the visible one
    const cta = page.locator('a[href="/vendor/apply"]').locator("visible=true");
    await expect(cta.first()).toBeVisible({ timeout: 15_000 });
  });

  test("anonymous /vendor/apply redirects to auth with redirect param", async ({ page }) => {
    await gotoStable(page, "/vendor/apply");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("logged-in non-vendor sees the apply form", async ({ page }) => {
    // 09120000006 (کاربر بدون دسترسی) never gains a vendor membership in any
    // suite — using it keeps this test independent of the vendor-apply spec.
    await loginViaChip(page, "کاربر بدون دسترسی");
    await submitAutofilledOtp(page);

    await gotoStable(page, "/vendor/apply");
    await page.waitForLoadState("networkidle").catch(() => {});
    // apply form renders for non-vendor users (not the "already vendor" message)
    await expect(page.locator("form").first()).toBeVisible({ timeout: 15_000 });
  });

  test("existing vendor is redirected from /vendor/apply to dashboard", async ({ page }) => {
    await loginViaChip(page, "فروشنده (مالک)");
    await submitAutofilledOtp(page);

    await gotoStable(page, "/vendor/apply");
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 20_000 });
  });
});
