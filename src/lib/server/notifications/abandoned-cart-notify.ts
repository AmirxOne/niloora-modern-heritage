import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";
import { sendJourneyNotification } from "@/lib/server/notifications/journey-notify";

type AbandonedCartMessageInput = {
  name?: string | null;
  recoverUrl: string;
  itemsCount: number;
};

function smsBody(input: AbandonedCartMessageInput): string {
  const displayName = input.name?.trim() || "دوست گرامی";
  return `${displayName}، سبد خرید شما هنوز تکمیل نشده است.\n${input.itemsCount.toLocaleString("fa-IR")} قلم در سبد شما منتظر است.\nادامه خرید: ${input.recoverUrl}`;
}

function emailBody(input: AbandonedCartMessageInput): { subject: string; html: string } {
  const subject = "سبد خرید شما منتظر تکمیل است";
  const displayName = input.name?.trim() || "دوست گرامی";
  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#2c2a29">
      <h2 style="margin:0 0 10px">یادآوری سبد خرید</h2>
      <p>${displayName}،</p>
      <p>شما ${input.itemsCount.toLocaleString("fa-IR")} قلم در سبد خرید دارید و فرآیند پرداخت نیمه‌کاره مانده است.</p>
      <p>
        <a href="${input.recoverUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">
          بازگشت مستقیم به پرداخت
        </a>
      </p>
    </div>
  `;
  return { subject, html };
}

export async function sendAbandonedCartReminder(input: {
  channel: "sms" | "email";
  contact: string;
  name?: string | null;
  recoverUrl: string;
  itemsCount: number;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  const journey = await sendJourneyNotification({
    journey: "abandoned_cart",
    channel: input.channel,
    recipient: input.contact,
    fingerprint: `abandoned:${input.channel}:${input.contact}:${input.recoverUrl}`,
    firstName: input.name ?? null,
    recoverUrl: input.recoverUrl,
    itemsCount: input.itemsCount,
  });
  if (journey.ok) return { ok: true };

  if (input.channel === "sms") {
    const result = await deliverTransactionalSms({
      phone: input.contact,
      message: smsBody(input),
    });
    if (!result.ok) {
      return { ok: false, detail: "detail" in result ? (result.detail ?? result.reason) : "sms_failed" };
    }
    return { ok: true };
  }

  const email = emailBody(input);
  const result = await sendResendEmail({
    to: input.contact,
    subject: email.subject,
    html: email.html,
  });
  if (!result.ok) {
    return { ok: false, detail: result.detail ?? result.reason };
  }
  return { ok: true };
}
