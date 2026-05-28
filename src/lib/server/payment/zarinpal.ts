import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { getEffectiveZarinpalConfig } from "@/lib/server/site-settings/effective-services";

type ZarinpalApiResponse<T> = {
  data: T;
  errors?: Array<{ code: number; message: string; validations?: unknown[] }>;
};

type RequestSuccess = {
  code: number;
  message: string;
  authority: string;
  fee_type: string;
  fee: number;
};

type VerifySuccess = {
  code: number;
  message: string;
  card_hash: string;
  card_pan: string;
  ref_id: number;
  fee_type: string;
  fee: number;
};

function apiBase(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/v4/payment"
    : "https://api.zarinpal.com/pg/v4/payment";
}

function startPayBase(sandbox: boolean): string {
  return sandbox
    ? "https://sandbox.zarinpal.com/pg/StartPay"
    : "https://www.zarinpal.com/pg/StartPay";
}

/** مبالغ سایت به تومان است؛ زرین‌پال ریال می‌خواهد. */
export function tomanToRial(amountToman: number): number {
  return Math.max(0, Math.round(amountToman * 10));
}

export function getZarinpalCallbackUrl(): string {
  return `${getAppBaseUrl()}/api/payments/zarinpal/callback`;
}

export async function isZarinpalConfigured(): Promise<boolean> {
  const config = await getEffectiveZarinpalConfig();
  return config.enabled && config.configured;
}

async function postZarinpal<T>(
  path: string,
  body: Record<string, unknown>,
  sandbox: boolean
): Promise<T> {
  const response = await fetch(`${apiBase(sandbox)}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const json = (await response.json()) as ZarinpalApiResponse<T>;
  if (!response.ok || json.errors?.length) {
    const err = json.errors?.[0];
    throw new Error(err?.message ?? `Zarinpal HTTP ${response.status}`);
  }
  return json.data;
}

export async function zarinpalRequestPayment(input: {
  amountRial: number;
  description: string;
  orderId: string;
  mobile?: string;
  email?: string;
}): Promise<{ authority: string; redirectUrl: string; fee: number }> {
  const config = await getEffectiveZarinpalConfig();
  if (!config.enabled || !config.merchantId) {
    throw new Error("Zarinpal merchant id is not configured");
  }

  const data = await postZarinpal<RequestSuccess>(
    "request.json",
    {
    merchant_id: config.merchantId,
    amount: input.amountRial,
    callback_url: getZarinpalCallbackUrl(),
    description: input.description.slice(0, 255),
    metadata: {
      order_id: input.orderId,
      ...(input.mobile ? { mobile: input.mobile } : {}),
      ...(input.email ? { email: input.email } : {}),
    },
    },
    config.sandbox
  );

  if (data.code !== 100 || !data.authority) {
    throw new Error(data.message || "Zarinpal request failed");
  }

  return {
    authority: data.authority,
    redirectUrl: `${startPayBase(config.sandbox)}/${data.authority}`,
    fee: data.fee,
  };
}

export async function zarinpalVerifyPayment(input: {
  authority: string;
  amountRial: number;
}): Promise<{
  ok: boolean;
  refId?: string;
  cardPan?: string;
  fee?: number;
  code: number;
  message: string;
}> {
  const config = await getEffectiveZarinpalConfig();
  if (!config.enabled || !config.merchantId) {
    throw new Error("Zarinpal merchant id is not configured");
  }

  const data = await postZarinpal<VerifySuccess>(
    "verify.json",
    {
      merchant_id: config.merchantId,
      amount: input.amountRial,
      authority: input.authority,
    },
    config.sandbox
  );

  const ok = data.code === 100 || data.code === 101;
  return {
    ok,
    refId: data.ref_id != null ? String(data.ref_id) : undefined,
    cardPan: data.card_pan,
    fee: data.fee,
    code: data.code,
    message: data.message,
  };
}
