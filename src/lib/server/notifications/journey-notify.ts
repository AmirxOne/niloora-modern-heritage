import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";
import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";
import { buildJourneyMessage, type JourneyTemplateKey } from "@/lib/server/notifications/journey-messages";
import { serverEnv } from "@/lib/server/env";

type JourneyChannel = "sms" | "email";
type JourneyKey = JourneyTemplateKey;

function pickFirstName(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  return parts[0] ?? "";
}

export async function sendJourneyNotification(input: {
  journey: JourneyKey;
  userId?: string;
  orderId?: string;
  channel: JourneyChannel;
  recipient: string;
  fingerprint: string;
  firstName?: string | null;
  orderIdText?: string;
  recoverUrl?: string;
  itemsCount?: number;
}): Promise<{ ok: boolean }> {
  if (!serverEnv.notifyEnabled) return { ok: false };

  const existed = await prisma.automatedJourneyEvent.findUnique({
    where: {
      journey_channel_fingerprint: {
        journey: input.journey,
        channel: input.channel,
        fingerprint: input.fingerprint,
      },
    },
  });
  if (existed?.status === "sent") return { ok: true };

  const message = buildJourneyMessage(input.journey, {
    firstName: input.firstName,
    orderId: input.orderIdText,
    recoverUrl: input.recoverUrl,
    itemsCount: input.itemsCount,
  });

  let ok = false;
  let detail: string | undefined;
  if (input.channel === "sms") {
    const phone = normalizeIranPhone(input.recipient);
    if (!phone) {
      detail = "invalid_phone";
    } else {
      const sent = await deliverTransactionalSms({ phone, message: message.sms });
      ok = sent.ok;
      detail = sent.ok ? undefined : "detail" in sent ? sent.detail : sent.reason;
    }
  } else {
    const sent = await sendResendEmail({
      to: input.recipient,
      subject: message.subject,
      html: message.html,
    });
    ok = sent.ok;
    detail = sent.ok ? undefined : sent.detail ?? sent.reason;
  }

  await prisma.automatedJourneyEvent.upsert({
    where: {
      journey_channel_fingerprint: {
        journey: input.journey,
        channel: input.channel,
        fingerprint: input.fingerprint,
      },
    },
    create: {
      journey: input.journey,
      channel: input.channel,
      recipient: input.recipient,
      fingerprint: input.fingerprint,
      userId: input.userId ?? null,
      orderId: input.orderId ?? null,
      status: ok ? "sent" : "failed",
      detail: detail ?? null,
      sentAt: ok ? new Date() : null,
    },
    update: {
      recipient: input.recipient,
      userId: input.userId ?? null,
      orderId: input.orderId ?? null,
      status: ok ? "sent" : "failed",
      detail: detail ?? null,
      sentAt: ok ? new Date() : null,
    },
  });

  return { ok };
}

export function queueWelcomeJourney(user: {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const firstName = pickFirstName(user.name);
  if (user.phone) {
    void sendJourneyNotification({
      journey: "welcome",
      userId: user.id,
      channel: "sms",
      recipient: user.phone,
      fingerprint: `welcome:sms:${user.id}`,
      firstName,
    });
  }
  if (user.email) {
    void sendJourneyNotification({
      journey: "welcome",
      userId: user.id,
      channel: "email",
      recipient: user.email,
      fingerprint: `welcome:email:${user.id}`,
      firstName,
    });
  }
}

export async function runBirthdayJourneys(now = new Date()): Promise<{ sent: number; failed: number }> {
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const users = await prisma.user.findMany({
    where: { birthDate: { not: null } },
    select: { id: true, name: true, phone: true, email: true, birthDate: true },
    take: 1500,
  });
  let sent = 0;
  let failed = 0;
  for (const user of users) {
    if (!user.birthDate) continue;
    const b = new Date(user.birthDate);
    if (b.getMonth() + 1 !== month || b.getDate() !== day) continue;
    const firstName = pickFirstName(user.name);
    const dateKey = `${now.getFullYear()}-${month}-${day}`;
    if (user.phone) {
      const r = await sendJourneyNotification({
        journey: "birthday",
        userId: user.id,
        channel: "sms",
        recipient: user.phone,
        fingerprint: `birthday:sms:${user.id}:${dateKey}`,
        firstName,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
    if (user.email) {
      const r = await sendJourneyNotification({
        journey: "birthday",
        userId: user.id,
        channel: "email",
        recipient: user.email,
        fingerprint: `birthday:email:${user.id}:${dateKey}`,
        firstName,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
  }
  return { sent, failed };
}

export async function runWinbackJourneys(now = new Date()): Promise<{ sent: number; failed: number }> {
  const threshold = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: {
      memberSince: { lte: threshold },
      orders: {
        none: { createdAt: { gte: threshold } },
      },
    },
    select: { id: true, name: true, phone: true, email: true },
    take: 1000,
  });
  let sent = 0;
  let failed = 0;
  const periodKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  for (const user of users) {
    const firstName = pickFirstName(user.name);
    if (user.phone) {
      const r = await sendJourneyNotification({
        journey: "winback",
        userId: user.id,
        channel: "sms",
        recipient: user.phone,
        fingerprint: `winback:sms:${user.id}:${periodKey}`,
        firstName,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
    if (user.email) {
      const r = await sendJourneyNotification({
        journey: "winback",
        userId: user.id,
        channel: "email",
        recipient: user.email,
        fingerprint: `winback:email:${user.id}:${periodKey}`,
        firstName,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
  }
  return { sent, failed };
}

export async function runOrderFollowupJourneys(now = new Date()): Promise<{ sent: number; failed: number }> {
  const lower = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const upper = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const orders = await prisma.order.findMany({
    where: {
      status: "processing",
      createdAt: { gte: lower, lte: upper },
    },
    include: { user: { select: { id: true, name: true, phone: true, email: true } } },
    take: 1200,
  });
  let sent = 0;
  let failed = 0;
  for (const order of orders) {
    const firstName = pickFirstName(order.shippingName ?? order.user.name);
    if (order.shippingPhone || order.user.phone) {
      const r = await sendJourneyNotification({
        journey: "order_followup",
        userId: order.userId,
        orderId: order.id,
        channel: "sms",
        recipient: order.shippingPhone ?? order.user.phone,
        fingerprint: `order_followup:sms:${order.id}`,
        firstName,
        orderIdText: order.id,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
    if (order.user.email) {
      const r = await sendJourneyNotification({
        journey: "order_followup",
        userId: order.userId,
        orderId: order.id,
        channel: "email",
        recipient: order.user.email,
        fingerprint: `order_followup:email:${order.id}`,
        firstName,
        orderIdText: order.id,
      });
      if (r.ok) sent += 1;
      else failed += 1;
    }
  }
  return { sent, failed };
}
