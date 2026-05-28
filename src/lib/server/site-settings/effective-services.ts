import { getSiteSettingsRow } from "@/lib/server/site-settings/site-settings";
import { serverEnv } from "@/lib/server/env";

export async function getEffectiveZarinpalConfig() {
  const row = await getSiteSettingsRow();
  const merchantId = row.zarinpalMerchantId?.trim() || serverEnv.zarinpalMerchantId;
  return {
    enabled: row.paymentGatewayEnabled,
    merchantId,
    sandbox: row.zarinpalSandbox,
    configured: Boolean(merchantId),
  };
}

export async function isPaymentGatewayAvailable(): Promise<boolean> {
  const config = await getEffectiveZarinpalConfig();
  return config.enabled && config.configured;
}

export async function isSmsServiceAvailable(): Promise<boolean> {
  const row = await getSiteSettingsRow();
  if (!row.smsEnabled) return false;
  if (row.smsProvider !== "kavenegar") return false;
  return Boolean(serverEnv.kavenegarApiKey);
}
