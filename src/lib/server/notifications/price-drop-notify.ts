import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";
import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";
import { getAppBaseUrl } from "@/lib/server/payment/app-url";
import { serverEnv } from "@/lib/server/env";

function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(Math.max(0, Math.round(amount)));
}

function unsubscribeUrl(token: string): string {
  return `${getAppBaseUrl()}/api/price-drop/unsubscribe?token=${encodeURIComponent(token)}`;
}

async function getOrCreateUnsubscribeToken(input: {
  userId: string;
  channel: "sms" | "email";
  contact: string;
}): Promise<string> {
  const existing = await prisma.priceDropUnsubscribeToken.findUnique({
    where: {
      userId_channel_contact: {
        userId: input.userId,
        channel: input.channel,
        contact: input.contact,
      },
    },
  });
  if (existing) {
    if (!existing.active) {
      await prisma.priceDropUnsubscribeToken.update({
        where: { id: existing.id },
        data: { active: true },
      });
    }
    return existing.token;
  }
  const token = randomUUID().replace(/-/g, "");
  await prisma.priceDropUnsubscribeToken.create({
    data: {
      token,
      userId: input.userId,
      channel: input.channel,
      contact: input.contact,
      active: true,
    },
  });
  return token;
}

async function isUnsubscribed(input: {
  userId: string;
  channel: "sms" | "email";
  contact: string;
}): Promise<boolean> {
  const row = await prisma.priceDropUnsubscribeToken.findUnique({
    where: {
      userId_channel_contact: {
        userId: input.userId,
        channel: input.channel,
        contact: input.contact,
      },
    },
  });
  return Boolean(row && !row.active);
}

async function upsertWatchPrice(input: {
  userId: string;
  productId: string;
  currentPrice: number;
}) {
  const pref = await prisma.userPreference.findUnique({ where: { userId: input.userId } });
  const current =
    pref?.wishlistPriceWatch && typeof pref.wishlistPriceWatch === "object" && !Array.isArray(pref.wishlistPriceWatch)
      ? (pref.wishlistPriceWatch as Record<string, number>)
      : {};
  const next = { ...current, [input.productId]: Math.round(input.currentPrice) };
  await prisma.userPreference.upsert({
    where: { userId: input.userId },
    create: { userId: input.userId, wishlistPriceWatch: next },
    update: { wishlistPriceWatch: next },
  });
}

export async function runPriceDropAlerts(): Promise<{ scanned: number; sent: number; failed: number }> {
  if (!serverEnv.notifyEnabled) return { scanned: 0, sent: 0, failed: 0 };
  const prefs = await prisma.userPreference.findMany({
    where: { wishlistIds: { not: Prisma.JsonNull } },
    select: { userId: true, wishlistIds: true, wishlistPriceWatch: true },
    take: 3000,
  });

  let scanned = 0;
  let sent = 0;
  let failed = 0;

  for (const pref of prefs) {
    const wishlistIds = Array.isArray(pref.wishlistIds) ? (pref.wishlistIds as string[]) : [];
    if (wishlistIds.length === 0) continue;
    const watch =
      pref.wishlistPriceWatch && typeof pref.wishlistPriceWatch === "object" && !Array.isArray(pref.wishlistPriceWatch)
        ? (pref.wishlistPriceWatch as Record<string, number>)
        : {};

    const user = await prisma.user.findUnique({
      where: { id: pref.userId },
      select: { id: true, name: true, phone: true, email: true },
    });
    if (!user) continue;

    const products = await prisma.product.findMany({
      where: { id: { in: wishlistIds } },
      select: { id: true, namePersian: true, price: true },
    });

    for (const product of products) {
      scanned += 1;
      const prevPrice = watch[product.id];
      if (!prevPrice || product.price >= prevPrice) {
        await upsertWatchPrice({ userId: user.id, productId: product.id, currentPrice: product.price });
        continue;
      }

      const productUrl = `${getAppBaseUrl()}/product/${encodeURIComponent(product.id)}`;
      const baseMessage = `خبر خوب! قیمت «${product.namePersian}» کاهش یافت.\nقیمت جدید: ${formatPrice(product.price)} تومان\nمشاهده: ${productUrl}`;

      const smsPhone = normalizeIranPhone(user.phone ?? "");
      if (smsPhone && !(await isUnsubscribed({ userId: user.id, channel: "sms", contact: smsPhone }))) {
        const token = await getOrCreateUnsubscribeToken({
          userId: user.id,
          channel: "sms",
          contact: smsPhone,
        });
        const message = `${baseMessage}\nلغو پیامک: ${unsubscribeUrl(token)}`;
        const res = await deliverTransactionalSms({ phone: smsPhone, message });
        if (res.ok) sent += 1;
        else failed += 1;
      }

      const email = user.email?.trim().toLowerCase();
      if (email && !(await isUnsubscribed({ userId: user.id, channel: "email", contact: email }))) {
        const token = await getOrCreateUnsubscribeToken({
          userId: user.id,
          channel: "email",
          contact: email,
        });
        const emailRes = await sendResendEmail({
          to: email,
          subject: `کاهش قیمت ${product.namePersian}`,
          html: `
            <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.8;color:#2c2a29">
              <h2>کاهش قیمت محصول موردعلاقه شما</h2>
              <p>قیمت «${product.namePersian}» کاهش پیدا کرده است.</p>
              <p><strong>قیمت قبلی:</strong> ${formatPrice(prevPrice)} تومان</p>
              <p><strong>قیمت جدید:</strong> ${formatPrice(product.price)} تومان</p>
              <p><a href="${productUrl}">مشاهده محصول</a></p>
              <p style="font-size:12px;color:#78716c"><a href="${unsubscribeUrl(token)}">لغو اعلان کاهش قیمت</a></p>
            </div>
          `.trim(),
        });
        if (emailRes.ok) sent += 1;
        else failed += 1;
      }

      await upsertWatchPrice({ userId: user.id, productId: product.id, currentPrice: product.price });
    }
  }
  return { scanned, sent, failed };
}
