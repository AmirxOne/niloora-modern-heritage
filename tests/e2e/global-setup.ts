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
}
