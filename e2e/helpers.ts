import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const TEST_ADMIN_PHONE = "09990000001";
export const TEST_CUSTOMER_PHONE = "09990000002";
export const TEST_CUSTOMER2_PHONE = "09990000003";
export const TEST_SELLER_PHONE = "09990000004";
export const TEST_SELLER2_PHONE = "09990000005";
export const TEST_PASSWORD = "Test@1234";

/** Active seeded seller shops (see prisma/seed-e2e.ts). */
export const TEST_SELLER_SLUG_A = "e2e-shop-a";
export const TEST_SELLER_SLUG_B = "e2e-shop-b";

export const ALPHA_PRODUCT_ID = "e2e-ring-alpha";
export const LASTUNIT_PRODUCT_ID = "e2e-ring-lastunit";
export const SOLDOUT_PRODUCT_ID = "e2e-ring-soldout";

/** Direct API login — sets the session cookie on the request context. */
export async function apiLogin(
  request: APIRequestContext,
  phone: string,
  password: string
): Promise<string> {
  const response = await request.post("/api/auth/login", {
    data: { phone, password },
  });
  expect(response.status()).toBe(200);
  const cookieHeader = response.headers()["set-cookie"];
  if (!cookieHeader) throw new Error("no session cookie after login");
  // cookie format: name=value; ...
  return cookieHeader.split(";")[0];
}

/** UI login through the /auth OTP page (dev mode returns otpPreview in the UI). */
export async function uiLogin(page: Page, phone: string, _password?: string) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto("/auth");
  const phoneInput = page.getByRole("textbox", { name: "شماره موبایل" });
  await phoneInput.waitFor({ timeout: 10_000 });

  // fill + dispatch a keystroke so formik re-validates synchronously
  await phoneInput.fill(phone);
  await phoneInput.press("End");
  await phoneInput.blur();

  const otpResponsePromise = page.waitForResponse(
    (res) => res.url().includes("/api/auth/otp/request") && res.request().method() === "POST",
    { timeout: 20_000 }
  );
  const submit = page.getByRole("button", { name: "ارسال کد تایید" });
  await expect(submit).toBeEnabled({ timeout: 10_000 });
  await submit.click();
  const otpResponse = await otpResponsePromise;
  const otpData = (await otpResponse.json()) as { otpPreview?: string };
  if (!otpData.otpPreview) {
    throw new Error(`OTP preview unavailable (${otpResponse.status()})`);
  }

  // OTP step: single composite input — type the digits; onComplete auto-verifies
  const otpBox = page.getByRole("textbox").nth(0);
  await otpBox.waitFor({ timeout: 15_000 });
  await otpBox.click();
  await page.keyboard.type(otpData.otpPreview, { delay: 50 });

  // wait until redirected away from /auth
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 20_000,
  });
  // tolerate the known dev-mode chunk SyntaxError (environment artifact)
  const realErrors = errors.filter((e) => !e.includes("Unexpected end of input") && !e.includes("Invalid or unexpected token"));
  if (realErrors.length) {
    throw new Error(`console errors during login: ${realErrors.join("; ")}`);
  }
}

export async function uiLogout(page: Page) {
  await page.goto("/account");
  // account menu trigger in header
  await page.getByRole("button", { name: /حساب|اکانت|منو/ }).first().click();
  const logout = page.getByRole("button", { name: /خروج/ }).first();
  if (await logout.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await logout.click();
  }
}

/** Authenticated fetch helper carrying the session cookie. */
export function authedFetch(cookie: string) {
  return {
    headers: { cookie },
  };
}
