import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";
import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";
import { buildJourneyMessage } from "@/lib/server/notifications/journey-messages";
import { serverEnv } from "@/lib/server/env";
import type { Prisma } from "@prisma/client";

type ReminderKind = "polish" | "stone_check";
type PrismaTx = Prisma.TransactionClient;

const REMINDER_PLAN: Array<{ kind: ReminderKind; daysAfterPurchase: number }> = [
  { kind: "polish", daysAfterPurchase: 45 },
  { kind: "stone_check", daysAfterPurchase: 90 },
];

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
}

function firstNameOf(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

function toJourney(kind: ReminderKind): "maintenance_polish" | "maintenance_stone_check" {
  return kind === "polish" ? "maintenance_polish" : "maintenance_stone_check";
}

export async function scheduleOrderMaintenanceReminders(tx: PrismaTx, orderId: string): Promise<void> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      createdAt: true,
      shippingPhone: true,
      user: { select: { phone: true, email: true } },
    },
  });
  if (!order) return;

  const smsRecipient = normalizeIranPhone(order.shippingPhone ?? order.user.phone ?? "");
  const emailRecipient = (order.user.email ?? "").trim() || null;

  for (const item of REMINDER_PLAN) {
    const dueAt = addDays(order.createdAt, item.daysAfterPurchase);
    if (smsRecipient) {
      await tx.maintenanceReminder.upsert({
        where: {
          orderId_kind_channel: { orderId: order.id, kind: item.kind, channel: "sms" },
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          kind: item.kind,
          channel: "sms",
          recipient: smsRecipient,
          dueAt,
          status: "pending",
        },
        update: {
          recipient: smsRecipient,
          dueAt,
          status: "pending",
          sentAt: null,
          lastError: null,
        },
      });
    }
    if (emailRecipient) {
      await tx.maintenanceReminder.upsert({
        where: {
          orderId_kind_channel: { orderId: order.id, kind: item.kind, channel: "email" },
        },
        create: {
          orderId: order.id,
          userId: order.userId,
          kind: item.kind,
          channel: "email",
          recipient: emailRecipient,
          dueAt,
          status: "pending",
        },
        update: {
          recipient: emailRecipient,
          dueAt,
          status: "pending",
          sentAt: null,
          lastError: null,
        },
      });
    }
  }
}

export async function runMaintenanceReminderJourneys(now = new Date()): Promise<{
  due: number;
  sent: number;
  failed: number;
}> {
  if (!serverEnv.notifyEnabled) return { due: 0, sent: 0, failed: 0 };

  const due = await prisma.maintenanceReminder.findMany({
    where: { status: "pending", dueAt: { lte: now } },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { dueAt: "asc" },
    take: 1000,
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of due) {
    const journey = toJourney(reminder.kind as ReminderKind);
    const message = buildJourneyMessage(journey, { firstName: firstNameOf(reminder.user?.name) });

    let ok = false;
    let detail: string | null = null;

    if (reminder.channel === "sms") {
      const phone = normalizeIranPhone(reminder.recipient);
      if (!phone) {
        detail = "invalid_phone";
      } else {
        const result = await deliverTransactionalSms({ phone, message: message.sms });
        ok = result.ok;
        if (result.ok) {
          detail = null;
        } else {
          detail = result.detail ?? result.reason ?? "sms_send_failed";
        }
      }
    } else {
      const result = await sendResendEmail({
        to: reminder.recipient,
        subject: message.subject,
        html: message.html,
      });
      ok = result.ok;
      detail = result.ok ? null : result.detail ?? result.reason;
    }

    await prisma.maintenanceReminder.update({
      where: { id: reminder.id },
      data: {
        status: ok ? "sent" : "failed",
        sentAt: ok ? new Date() : null,
        notifyAttempts: { increment: 1 },
        lastError: detail,
      },
    });

    if (ok) sent += 1;
    else failed += 1;
  }

  return { due: due.length, sent, failed };
}
