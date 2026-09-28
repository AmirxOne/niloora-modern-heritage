import type { FullConfig } from "@playwright/test";

type WarmupTarget = {
  method?: "GET" | "POST";
  path: string;
  body?: string;
  headers?: Record<string, string>;
  expectStatus: (status: number) => boolean;
};

const BOOTSTRAP_TARGETS: WarmupTarget[] = [
  { path: "/api/health", expectStatus: (status) => status >= 200 && status < 500 },
  { path: "/", expectStatus: (status) => status >= 200 && status < 500 },
  { path: "/shop", expectStatus: (status) => status >= 200 && status < 500 },
  { path: "/auth", expectStatus: (status) => status >= 200 && status < 500 },
  {
    method: "POST",
    path: "/api/orders",
    body: "{}",
    headers: { "content-type": "application/json" },
    expectStatus: (status) => status >= 400 && status < 500,
  },
  {
    method: "POST",
    path: "/api/vendor/apply",
    body: JSON.stringify({ displayName: "warmup" }),
    headers: { "content-type": "application/json" },
    expectStatus: (status) => status === 401 || status === 403 || status === 400,
  },
  {
    method: "POST",
    path: "/api/auth/otp/request",
    body: JSON.stringify({ phone: "09120000000" }),
    headers: { "content-type": "application/json" },
    expectStatus: (status) => status >= 200 && status < 500,
  },
  {
    method: "POST",
    path: "/api/vendor/media",
    body: "",
    headers: { "content-type": "multipart/form-data; boundary=warmup" },
    expectStatus: (status) => status >= 400 && status < 500,
  },
];

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function probe(baseURL: string, target: WarmupTarget): Promise<void> {
  const maxAttempts = 20;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}${target.path}`, {
        method: target.method ?? "GET",
        headers: target.headers,
        body: target.body,
        redirect: "follow",
        signal: AbortSignal.timeout(12_000),
      });
      if (target.expectStatus(response.status)) return;
    } catch {
      // retry
    }
    await wait(Math.min(4000, 400 * attempt));
  }
  throw new Error(`E2E bootstrap failed for ${target.path}`);
}

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    config.projects[0]?.use?.baseURL?.toString() ??
    process.env.E2E_BASE_URL ??
    "http://127.0.0.1:3000";

  for (const target of BOOTSTRAP_TARGETS) {
    await probe(baseURL, target);
  }

  await resetSharedTestState();
}

/**
 * وضعیت مشترک بین suiteها را ریست می‌کند تا ترتیب اجرا اهمیت نداشته باشد:
 * ۱) vendorهای ساخته‌شده توسط «کاربر عادی» تست (09120000003) حذف می‌شوند
 *    (spec مربوط به vendor-apply هر بار از صفر شروع کند).
 * ۲) bucketهای rate limit پاک می‌شوند (اجرای مجدد suite در همان روز).
 * فقط وقتی DATABASE_URL در دسترس است اجرا می‌شود؛ در CI بدون DB صرفاً skip می‌شود.
 */
async function resetSharedTestState(): Promise<void> {
  let databaseUrl = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    // Playwright does not load .env.local automatically — read it manually.
    try {
      const { readFile } = await import("node:fs/promises");
      const envLocal = await readFile(".env.local", "utf8").catch(() => "");
      const env = await readFile(".env", "utf8").catch(() => "");
      const match =
        /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(envLocal) ??
        /DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/.exec(env);
      if (match) databaseUrl = match[1].trim();
    } catch {
      // ignore — skip reset
    }
  }
  if (!databaseUrl) return;
  try {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();

    const vendors = await client.query(
      `SELECT v.id FROM "Vendor" v
       JOIN "VendorMember" m ON m."vendorId" = v.id
       JOIN "User" u ON u.id = m."userId"
       WHERE u.phone = '09120000003'`
    );
    if (vendors.rows.length > 0) {
      const ids = vendors.rows.map((r: { id: string }) => r.id);
      await client.query('DELETE FROM "VendorMember" WHERE "vendorId" = ANY($1)', [ids]);
      await client.query('DELETE FROM "VendorSettings" WHERE "vendorId" = ANY($1)', [ids]);
      await client.query('DELETE FROM "Vendor" WHERE id = ANY($1)', [ids]);
    }

    // Remove leftover products from previous role-rbac runs — pending_review
    // leftovers exhaust the vendor quota (maxPendingSubmissions) and make the
    // next run fail with 409 before its own assertions.
    const leftovers = await client.query(
      `DELETE FROM "ProductModerationEvent"
       WHERE "productId" IN (
         SELECT id FROM "Product"
         WHERE "vendorId" IS NOT NULL
           AND (name = 'Vendor Role Ring' OR name = 'Staff Attempt Ring')
       ) RETURNING "productId"`
    );
    if (leftovers.rows.length > 0) {
      await client.query(
        'DELETE FROM "Product" WHERE "vendorId" IS NOT NULL AND (name = $1 OR name = $2)',
        ["Vendor Role Ring", "Staff Attempt Ring"]
      );
    }

    await client.query('DELETE FROM "RateLimitBucket"');
    await client.end();
    console.log(
      `[e2e-global-setup] reset shared state (${vendors.rows.length} test vendors, ${leftovers.rows.length} moderation rows removed)`
    );
  } catch (error) {
    console.warn("[e2e-global-setup] shared state reset skipped:", (error as Error).message);
  }
}
