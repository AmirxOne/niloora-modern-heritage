import { expect, type Page } from "@playwright/test";

export async function gotoStable(
  page: Page,
  path: string,
  options?: {
    timeoutMs?: number;
  }
): Promise<void> {
  const timeoutMs = options?.timeoutMs ?? 45_000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await page.goto(path, {
        timeout: timeoutMs,
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("body")).toBeVisible({ timeout: 10_000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) break;
      // Allow a single retry to absorb first-hit Next.js dev compilation jitter.
      await page.waitForTimeout(1000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Navigation failed for ${path}`);
}
