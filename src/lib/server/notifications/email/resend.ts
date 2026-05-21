import { serverEnv } from "@/lib/server/env";
import { isNotificationDevPreview } from "@/lib/server/sms/send-transactional";

export type EmailSendResult =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "provider_error"; detail?: string };

export function isTransactionalEmailConfigured(): boolean {
  return (
    serverEnv.notifyEmailEnabled &&
    Boolean(serverEnv.resendApiKey && serverEnv.resendFromEmail)
  );
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailSendResult> {
  if (isNotificationDevPreview()) {
    console.info("[notify:email:preview]", input.to, input.subject);
    return { ok: true };
  }

  if (!isTransactionalEmailConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: serverEnv.resendFromEmail,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
    cache: "no-store",
  });

  if (response.ok) return { ok: true };

  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return {
    ok: false,
    reason: "provider_error",
    detail: body?.message ?? `HTTP ${response.status}`,
  };
}
