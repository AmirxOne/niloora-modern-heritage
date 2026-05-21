import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { formatPrice } from "@/lib/utils";

export type OrderNotifyContext = {
  orderId: string;
  total: number;
  customerName: string;
  trackingCode?: string | null;
};

function receiptUrl(orderId: string): string {
  return `${getAppBaseUrl()}/account/orders/${encodeURIComponent(orderId)}/receipt`;
}

export function buildOrderPlacedSms(ctx: OrderNotifyContext): string {
  return [
    "گالری نیلورا",
    `${ctx.customerName} عزیز، سفارش شما ثبت شد.`,
    `شماره سفارش: ${ctx.orderId}`,
    `مبلغ: ${formatPrice(ctx.total)}`,
    `مشاهده: ${receiptUrl(ctx.orderId)}`,
  ].join("\n");
}

export function buildOrderShippedSms(ctx: OrderNotifyContext): string {
  const lines = [
    "گالری نیلورا",
    `${ctx.customerName} عزیز، سفارش شما ارسال شد.`,
    `شماره سفارش: ${ctx.orderId}`,
  ];
  if (ctx.trackingCode) {
    lines.push(`کد رهگیری: ${ctx.trackingCode}`);
  }
  lines.push(`پیگیری: ${receiptUrl(ctx.orderId)}`);
  return lines.join("\n");
}

export function buildOrderPlacedEmail(ctx: OrderNotifyContext): {
  subject: string;
  html: string;
} {
  const url = receiptUrl(ctx.orderId);
  return {
    subject: `ثبت سفارش ${ctx.orderId} — گالری نیلورا`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8">
        <p>${ctx.customerName} عزیز،</p>
        <p>سفارش شما با موفقیت ثبت شد.</p>
        <p><strong>شماره سفارش:</strong> ${ctx.orderId}</p>
        <p><strong>مبلغ:</strong> ${formatPrice(ctx.total)}</p>
        <p><a href="${url}">مشاهده فاکتور سفارش</a></p>
      </div>
    `.trim(),
  };
}

export function buildOrderShippedEmail(ctx: OrderNotifyContext): {
  subject: string;
  html: string;
} {
  const url = receiptUrl(ctx.orderId);
  const tracking = ctx.trackingCode
    ? `<p><strong>کد رهگیری:</strong> ${ctx.trackingCode}</p>`
    : "";
  return {
    subject: `ارسال سفارش ${ctx.orderId} — گالری نیلورا`,
    html: `
      <div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.8">
        <p>${ctx.customerName} عزیز،</p>
        <p>سفارش شما ارسال شد.</p>
        <p><strong>شماره سفارش:</strong> ${ctx.orderId}</p>
        ${tracking}
        <p><a href="${url}">مشاهده وضعیت سفارش</a></p>
      </div>
    `.trim(),
  };
}
