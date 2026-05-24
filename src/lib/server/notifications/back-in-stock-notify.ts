import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";

type BackInStockMessageInput = {
  productName: string;
  productId: string;
  productUrl: string;
};

function smsBody(input: BackInStockMessageInput): string {
  return `خبر خوب! «${input.productName}» دوباره موجود/قابل سفارش شد.\nمشاهده: ${input.productUrl}`;
}

function emailBody(input: BackInStockMessageInput): { subject: string; html: string } {
  const subject = `بازگشت موجودی: ${input.productName}`;
  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#2c2a29">
      <h2 style="margin:0 0 10px">بازگشت موجودی</h2>
      <p>محصول <strong>${input.productName}</strong> دوباره موجود یا قابل سفارش شده است.</p>
      <p>
        <a href="${input.productUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">
          مشاهده محصول
        </a>
      </p>
      <p style="font-size:12px;color:#78716c">شناسه محصول: ${input.productId}</p>
    </div>
  `;
  return { subject, html };
}

export async function sendBackInStockNotification(input: {
  channel: "sms" | "email";
  contact: string;
  productName: string;
  productId: string;
  productUrl: string;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
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
