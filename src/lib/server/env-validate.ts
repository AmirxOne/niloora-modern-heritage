import { isSentryEnabled } from "@/lib/observability/sentry-config";
import { serverEnv } from "@/lib/server/env";

export type EnvCheckResult = {
  ok: boolean;
  detail?: string;
};

export type EnvHealthStatus = "ok" | "degraded" | "error";

export type EnvHealthReport = {
  status: EnvHealthStatus;
  environment: string;
  checks: Record<string, EnvCheckResult>;
};

let startupValidated = false;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Skip strict env checks while Next is compiling (`next build`), not at runtime. */
function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function shouldEnforceProductionEnv(): boolean {
  return isProduction() && !isNextBuildPhase();
}

function resolvePublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    ""
  );
}

function collectProductionWarnings(): string[] {
  if (!shouldEnforceProductionEnv()) return [];

  const warnings: string[] = [];

  if (serverEnv.notifyEnabled) {
    if (!serverEnv.kavenegarApiKey) {
      warnings.push("KAVENEGAR_API_KEY is missing — OTP/SMS notifications will fail.");
    }
    if (!serverEnv.kavenegarOtpTemplate) {
      warnings.push("KAVENEGAR_OTP_TEMPLATE is missing — OTP Lookup will fail.");
    }
  }

  if (!serverEnv.zarinpalMerchantId) {
    warnings.push(
      "ZARINPAL_MERCHANT_ID is not set — payments work only if merchant ID exists in site settings (DB)."
    );
  }

  if (serverEnv.zarinpalSandbox) {
    warnings.push("ZARINPAL_SANDBOX=true — use sandbox=false for live payments.");
  }

  const sentryExplicitlyOff = process.env.SENTRY_ENABLED === "false";
  if (!sentryExplicitlyOff && !isSentryEnabled()) {
    warnings.push(
      "Sentry DSN not configured — set SENTRY_DSN + NEXT_PUBLIC_SENTRY_DSN or SENTRY_ENABLED=false."
    );
  }

  if (serverEnv.notifyEmailEnabled) {
    if (!serverEnv.resendApiKey) warnings.push("NOTIFY_EMAIL_ENABLED=true but RESEND_API_KEY is missing.");
    if (!serverEnv.resendFromEmail) {
      warnings.push("NOTIFY_EMAIL_ENABLED=true but RESEND_FROM_EMAIL is missing.");
    }
  }

  return warnings;
}

/** Fail fast when the Node server boots in production with missing critical env. */
export function validateProductionStartup(): void {
  if (startupValidated) return;
  startupValidated = true;

  if (!shouldEnforceProductionEnv()) return;

  const missing: string[] = [];

  if (!process.env.DATABASE_URL?.trim()) missing.push("DATABASE_URL");
  if (!resolvePublicSiteUrl()) {
    missing.push("NEXT_PUBLIC_SITE_URL (or NEXT_PUBLIC_APP_URL / APP_URL)");
  }
  if (!serverEnv.abandonedCartCronSecret) {
    missing.push("ABANDONED_CART_CRON_SECRET");
  }

  if (missing.length > 0) {
    throw new Error(
      `[Niloora] Production startup blocked — set required environment variables:\n${missing
        .map((key) => `  • ${key}`)
        .join("\n")}`
    );
  }

  const warnings = collectProductionWarnings();
  if (warnings.length > 0) {
    console.warn(
      `[Niloora] Production env warnings:\n${warnings.map((line) => `  • ${line}`).join("\n")}`
    );
  }
}

function checkSessionSecret(): EnvCheckResult {
  try {
    if (!serverEnv.sessionSecret || serverEnv.sessionSecret.length < 16) {
      return { ok: false, detail: "SESSION_SECRET missing or too short" };
    }
    return { ok: true };
  } catch {
    return { ok: false, detail: "SESSION_SECRET missing" };
  }
}

function checkSiteUrl(): EnvCheckResult {
  const url = resolvePublicSiteUrl();
  if (!url) return { ok: false, detail: "public site URL not configured" };
  return { ok: true, detail: url };
}

function checkCronSecret(): EnvCheckResult {
  if (!serverEnv.abandonedCartCronSecret) {
    return { ok: false, detail: "ABANDONED_CART_CRON_SECRET not set" };
  }
  return { ok: true };
}

function checkSms(): EnvCheckResult {
  if (!serverEnv.notifyEnabled) return { ok: true, detail: "NOTIFY_ENABLED=false" };
  if (!serverEnv.kavenegarApiKey) {
    return { ok: false, detail: "KAVENEGAR_API_KEY missing" };
  }
  if (!serverEnv.kavenegarOtpTemplate) {
    return { ok: false, detail: "KAVENEGAR_OTP_TEMPLATE missing" };
  }
  return { ok: true, detail: `provider=${serverEnv.smsProvider}` };
}

function checkZarinpalEnv(): EnvCheckResult {
  if (serverEnv.zarinpalMerchantId) {
    return {
      ok: true,
      detail: serverEnv.zarinpalSandbox ? "env merchant (sandbox)" : "env merchant (live)",
    };
  }
  return { ok: false, detail: "ZARINPAL_MERCHANT_ID not set in env" };
}

function checkSentry(): EnvCheckResult {
  if (process.env.SENTRY_ENABLED === "false") {
    return { ok: true, detail: "disabled" };
  }
  if (isSentryEnabled()) {
    return { ok: true, detail: getSentryEnvironment() };
  }
  return { ok: false, detail: "DSN not configured" };
}

function getSentryEnvironment(): string {
  return (
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development"
  );
}

async function checkDatabase(): Promise<EnvCheckResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { ok: false, detail: "DATABASE_URL missing" };
  }
  try {
    const { prisma } = await import("@/lib/server/prisma");
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "database unreachable";
    return { ok: false, detail: message };
  }
}

async function checkZarinpalEffective(): Promise<EnvCheckResult> {
  try {
    const { getEffectiveZarinpalConfig } = await import(
      "@/lib/server/site-settings/effective-services"
    );
    const config = await getEffectiveZarinpalConfig();
    if (!config.enabled) return { ok: false, detail: "payment gateway disabled in site settings" };
    if (!config.configured) return { ok: false, detail: "merchant ID missing (env + DB)" };
    return {
      ok: true,
      detail: config.sandbox ? "configured (sandbox)" : "configured (live)",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "site settings unavailable";
    return { ok: false, detail: message };
  }
}

function aggregateStatus(checks: Record<string, EnvCheckResult>): EnvHealthStatus {
  const entries = Object.entries(checks);
  if (entries.some(([key, check]) => key === "database" && !check.ok)) return "error";
  if (entries.some(([, check]) => !check.ok)) return "degraded";
  return "ok";
}

export async function buildEnvHealthReport(options?: {
  includeDatabase?: boolean;
  includeEffectiveZarinpal?: boolean;
}): Promise<EnvHealthReport> {
  const checks: Record<string, EnvCheckResult> = {
    sessionSecret: checkSessionSecret(),
    siteUrl: checkSiteUrl(),
    cronSecret: checkCronSecret(),
    sms: checkSms(),
    zarinpalEnv: checkZarinpalEnv(),
    sentry: checkSentry(),
  };

  if (options?.includeDatabase) {
    checks.database = await checkDatabase();
  }

  if (options?.includeEffectiveZarinpal) {
    checks.zarinpalEffective = await checkZarinpalEffective();
  }

  return {
    status: aggregateStatus(checks),
    environment: process.env.NODE_ENV ?? "development",
    checks,
  };
}
