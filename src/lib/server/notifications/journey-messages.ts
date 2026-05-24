import { getAppBaseUrl } from "@/lib/server/payment/app-url";

export type JourneyTemplateKey =
  | "welcome"
  | "birthday"
  | "abandoned_cart"
  | "winback"
  | "order_followup"
  | "maintenance_polish"
  | "maintenance_stone_check";

type JourneyMessage = {
  subject: string;
  sms: string;
  html: string;
};

function appUrl(path: string): string {
  return `${getAppBaseUrl()}${path}`;
}

function shell(title: string, body: string): string {
  return `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#2c2a29">
      <h2 style="margin:0 0 12px">${title}</h2>
      ${body}
    </div>
  `.trim();
}

export function buildJourneyMessage(
  key: JourneyTemplateKey,
  input: {
    firstName?: string | null;
    orderId?: string;
    recoverUrl?: string;
    itemsCount?: number;
  }
): JourneyMessage {
  const name = input.firstName?.trim() || "دوست گرامی";
  if (key === "welcome") {
    const url = appUrl("/shop");
    return {
      subject: "به نیلورا خوش آمدید",
      sms: `سلام ${name} عزیز، به خانواده نیلورا خوش آمدید.\nشروع خرید: ${url}`,
      html: shell(
        "به نیلورا خوش آمدید",
        `<p>${name} عزیز، عضویت شما با موفقیت انجام شد.</p><p><a href="${url}">ورود به گالری</a></p>`
      ),
    };
  }
  if (key === "birthday") {
    const url = appUrl("/shop");
    return {
      subject: "تولدتان مبارک از طرف نیلورا",
      sms: `${name} عزیز، تولدتان مبارک 🌸\nبرای شما پیشنهاد ویژه فعال شده است.\n${url}`,
      html: shell(
        "تولدتان مبارک",
        `<p>${name} عزیز، تیم نیلورا تولد شما را تبریک می‌گوید.</p><p><a href="${url}">مشاهده پیشنهادهای مناسب هدیه</a></p>`
      ),
    };
  }
  if (key === "abandoned_cart") {
    const recover = input.recoverUrl ?? appUrl("/cart?step=checkout");
    const count = input.itemsCount ?? 1;
    return {
      subject: "یادآوری سبد خرید شما",
      sms: `${name} عزیز، ${count.toLocaleString("fa-IR")} قلم در سبد خرید شما منتظر تکمیل سفارش است.\nادامه خرید: ${recover}`,
      html: shell(
        "یادآوری سبد خرید",
        `<p>${name} عزیز، سبد خرید شما هنوز تکمیل نشده است.</p><p><a href="${recover}">بازگشت به checkout</a></p>`
      ),
    };
  }
  if (key === "winback") {
    const url = appUrl("/shop");
    return {
      subject: "دلمان برای سلیقه شما تنگ شده",
      sms: `${name} عزیز، مدت‌هاست شما را در گالری ندیدیم.\nجدیدترین آثار نیلورا: ${url}`,
      html: shell(
        "بازگشت شما برای ما ارزشمند است",
        `<p>${name} عزیز، آثار جدیدی به گالری اضافه شده است.</p><p><a href="${url}">مشاهده جدیدترین محصولات</a></p>`
      ),
    };
  }
  if (key === "maintenance_polish") {
    const supportUrl = appUrl("/account?section=support");
    return {
      subject: "یادآوری سرویس دوره‌ای پولیش",
      sms: `${name} عزیز، زمان سرویس دوره‌ای پولیش انگشتر شما رسیده است.\nرزرو هماهنگی: ${supportUrl}`,
      html: shell(
        "یادآوری سرویس پولیش",
        `<p>${name} عزیز، پیشنهاد می‌کنیم برای حفظ درخشندگی رکاب، سرویس پولیش دوره‌ای را ثبت کنید.</p><p><a href="${supportUrl}">ثبت درخواست سرویس</a></p>`
      ),
    };
  }
  if (key === "maintenance_stone_check") {
    const supportUrl = appUrl("/account?section=support");
    return {
      subject: "یادآوری بازبینی نگین",
      sms: `${name} عزیز، زمان بازبینی دوره‌ای نگین سفارش شما فرا رسیده است.\nدرخواست بازبینی: ${supportUrl}`,
      html: shell(
        "یادآوری بازبینی نگین",
        `<p>${name} عزیز، برای اطمینان از استحکام نگین‌نشانی، بازبینی دوره‌ای توصیه می‌شود.</p><p><a href="${supportUrl}">ثبت بازبینی نگین</a></p>`
      ),
    };
  }
  const orderId = input.orderId ?? "—";
  const receiptUrl = appUrl(`/account/orders/${encodeURIComponent(orderId)}/receipt`);
  return {
    subject: `پیگیری سفارش ${orderId}`,
    sms: `${name} عزیز، سفارش ${orderId} در حال پردازش است.\nبرای مشاهده وضعیت: ${receiptUrl}`,
    html: shell(
      "پیگیری سفارش",
      `<p>${name} عزیز، سفارش شما در حال پردازش توسط کارگاه است.</p><p><a href="${receiptUrl}">مشاهده وضعیت سفارش</a></p>`
    ),
  };
}
