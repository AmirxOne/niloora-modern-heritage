import { serverEnv } from "@/lib/server/env";

export type SmsSendResult = { ok: true } | { ok: false; reason: "not_configured" | "provider_error"; detail?: string };

type KavenegarReturn = {
  status?: number;
  message?: string;
};

async function parseKavenegarResponse(response: Response): Promise<SmsSendResult> {
  const raw = (await response.json().catch(() => null)) as {
    return?: KavenegarReturn;
  } | null;

  const status = raw?.return?.status;
  if (response.ok && status === 200) {
    return { ok: true };
  }

  return {
    ok: false,
    reason: "provider_error",
    detail: raw?.return?.message ?? `HTTP ${response.status}`,
  };
}

/** ارسال OTP با قالب Verify Lookup (پیشنهادی در پنل کاوه‌نگار) */
export async function sendKavenegarOtpLookup(phone: string, code: string): Promise<SmsSendResult> {
  const apiKey = serverEnv.kavenegarApiKey;
  const template = serverEnv.kavenegarOtpTemplate;
  if (!apiKey || !template) {
    return { ok: false, reason: "not_configured" };
  }

  const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`);
  url.searchParams.set("receptor", phone);
  url.searchParams.set("token", code);
  url.searchParams.set("template", template);

  const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  return parseKavenegarResponse(response);
}

/** fallback: پیام متنی ساده اگر قالب Lookup ندارید */
export async function sendKavenegarPlainSms(phone: string, message: string): Promise<SmsSendResult> {
  const apiKey = serverEnv.kavenegarApiKey;
  const sender = serverEnv.kavenegarSender;
  if (!apiKey || !sender) {
    return { ok: false, reason: "not_configured" };
  }

  const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/sms/send.json`);
  url.searchParams.set("receptor", phone);
  url.searchParams.set("sender", sender);
  url.searchParams.set("message", message);

  const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  return parseKavenegarResponse(response);
}

/** قالب Lookup با چند token (token، token2، token3، …) */
export async function sendKavenegarLookupTokens(input: {
  phone: string;
  template: string;
  tokens: string[];
}): Promise<SmsSendResult> {
  const apiKey = serverEnv.kavenegarApiKey;
  if (!apiKey || !input.template) {
    return { ok: false, reason: "not_configured" };
  }

  const url = new URL(
    `https://api.kavenegar.com/v1/${encodeURIComponent(apiKey)}/verify/lookup.json`
  );
  url.searchParams.set("receptor", input.phone);
  url.searchParams.set("template", input.template);
  input.tokens.slice(0, 10).forEach((value, index) => {
    const key = index === 0 ? "token" : `token${index + 1}`;
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  return parseKavenegarResponse(response);
}
