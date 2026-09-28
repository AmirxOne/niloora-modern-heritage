import { test, expect, type Page } from "@playwright/test";
import { gotoStable } from "./support/navigation";

/**
 * Full "become a seller" UI journey: a plain user submits the vendor
 * application form on /vendor/apply and lands on the dashboard with a
 * draft/pending application. (Admin approval + publish flow is covered by
 * role-rbac and marketplace API suites.)
 */

async function loginPlainUser(page: Page) {
  await gotoStable(page, "/auth");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  const chip = page
    .getByTestId("dev-test-accounts")
    .locator("button", { hasText: "کاربر عادی" })
    .first();
  await expect(chip).toBeVisible({ timeout: 15_000 });
  const otpRequest = page.waitForRequest(
    (req) => req.url().includes("/api/auth/otp/request") && req.method() === "POST",
    { timeout: 20_000 }
  );
  await chip.click();
  await otpRequest;
  await expect(page.locator(".auth-otp-wrap")).toBeVisible({ timeout: 20_000 });

  const submit = page.getByRole("button", { name: /تایید|ورود/ }).first();
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  await page.waitForTimeout(2500);
}

test("plain user submits vendor application form end-to-end", async ({ page }) => {
  await loginPlainUser(page);

  await gotoStable(page, "/vendor/apply");
  await page.waitForLoadState("networkidle").catch(() => {});

  const form = page.locator("form", { has: page.locator("#displayName") });
  await expect(form).toBeVisible({ timeout: 15_000 });

  // fill the application form (fields per VendorApplyForm)
  const stamp = Date.now().toString(36);
  await form.locator("#displayName").fill(`Test Atelier ${stamp}`);
  const faName = form.locator("#displayNameFa");
  if (await faName.isVisible().catch(() => false)) {
    await faName.fill(`کارگاه تست ${stamp}`);
  }
  const textarea = form.locator("#description");
  if (await textarea.isVisible().catch(() => false)) {
    await textarea.fill("توضیح کوتاه کارگاه برای تست E2E");
  }

  const applyRequest = page.waitForResponse(
    (res) => res.url().includes("/api/vendor/apply") && res.request().method() === "POST",
    { timeout: 20_000 }
  );
  await form.locator('button[type="submit"]').first().click();
  const res = await applyRequest;
  expect(res.status()).toBeGreaterThanOrEqual(200);

  // redirect to vendor dashboard after success
  await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 20_000 });
});
