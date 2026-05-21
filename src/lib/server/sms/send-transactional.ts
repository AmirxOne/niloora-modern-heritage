import { serverEnv } from "@/lib/server/env";
import {
  sendKavenegarLookupTokens,
  sendKavenegarPlainSms,
  type SmsSendResult,
} from "@/lib/server/sms/kavenegar";

export function isTransactionalSmsConfigured(): boolean {
  return (
    serverEnv.smsProvider === "kavenegar" &&
    Boolean(serverEnv.kavenegarApiKey && serverEnv.kavenegarSender)
  );
}

export function isNotificationDevPreview(): boolean {
  return process.env.NODE_ENV !== "production";
}

export async function deliverTransactionalSms(input: {
  phone: string;
  message: string;
  template?: string;
  templateTokens?: string[];
}): Promise<SmsSendResult> {
  if (isNotificationDevPreview()) {
    console.info("[notify:sms:preview]", input.phone, input.message);
    return { ok: true };
  }

  if (!serverEnv.notifyEnabled) {
    return { ok: false, reason: "not_configured", detail: "notifications_disabled" };
  }

  if (input.template && input.templateTokens?.length) {
    const lookup = await sendKavenegarLookupTokens({
      phone: input.phone,
      template: input.template,
      tokens: input.templateTokens,
    });
    if (lookup.ok) return lookup;
  }

  if (!serverEnv.kavenegarSender) {
    return { ok: false, reason: "not_configured" };
  }

  return sendKavenegarPlainSms(input.phone, input.message);
}
