import { normalizeIranPhone } from "@/lib/auth/phone";
import { sendResendEmail } from "@/lib/server/notifications/email/resend";
import {
  buildOrderPlacedEmail,
  buildOrderPlacedSms,
  buildOrderShippedEmail,
  buildOrderShippedSms,
  type OrderNotifyContext,
} from "@/lib/server/notifications/order-messages";
import { serverEnv } from "@/lib/server/env";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";
import { deliverTransactionalSms } from "@/lib/server/sms/send-transactional";

const orderNotifyInclude = {
  user: { select: { phone: true, name: true, email: true } },
} as const;

type NotifyKind = "order_placed" | "order_shipped" | "order_tracking";

function resolveNotifyPhone(order: {
  shippingPhone: string | null;
  user: { phone: string };
}): string | null {
  return (
    normalizeIranPhone(order.shippingPhone ?? "") ??
    normalizeIranPhone(order.user.phone ?? "")
  );
}

function customerDisplayName(order: {
  shippingName: string | null;
  user: { name: string };
}): string {
  const name = order.shippingName?.trim() || order.user.name?.trim();
  return name || "مشتری";
}

async function wasAlreadySent(
  orderId: string,
  kind: NotifyKind,
  channel: string,
  fingerprint?: string | null
): Promise<boolean> {
  const row = await prisma.orderNotification.findUnique({
    where: {
      orderId_kind_channel: { orderId, kind, channel },
    },
  });
  if (!row || row.status !== "sent") return false;
  if (kind === "order_tracking" && fingerprint && row.fingerprint !== fingerprint) {
    return false;
  }
  return true;
}

async function recordNotification(input: {
  orderId: string;
  kind: NotifyKind;
  channel: string;
  recipient: string;
  fingerprint?: string | null;
  status: "sent" | "failed" | "skipped";
  detail?: string;
}): Promise<void> {
  await prisma.orderNotification.upsert({
    where: {
      orderId_kind_channel: {
        orderId: input.orderId,
        kind: input.kind,
        channel: input.channel,
      },
    },
    create: {
      orderId: input.orderId,
      kind: input.kind,
      channel: input.channel,
      recipient: input.recipient,
      fingerprint: input.fingerprint ?? null,
      status: input.status,
      detail: input.detail ?? null,
    },
    update: {
      recipient: input.recipient,
      fingerprint: input.fingerprint ?? null,
      status: input.status,
      detail: input.detail ?? null,
    },
  });
}

async function sendSmsNotification(input: {
  orderId: string;
  kind: NotifyKind;
  phone: string;
  message: string;
  template?: string;
  templateTokens?: string[];
  fingerprint?: string | null;
}): Promise<void> {
  if (await wasAlreadySent(input.orderId, input.kind, "sms", input.fingerprint)) {
    return;
  }

  const result = await deliverTransactionalSms({
    phone: input.phone,
    message: input.message,
    template: input.template,
    templateTokens: input.templateTokens,
  });

  await recordNotification({
    orderId: input.orderId,
    kind: input.kind,
    channel: "sms",
    recipient: input.phone,
    fingerprint: input.fingerprint ?? null,
    status: result.ok ? "sent" : "failed",
    detail: result.ok ? undefined : ("detail" in result ? result.detail : undefined),
  });

  if (!result.ok) {
    serverLogger.warn("notify_sms_failed", { kind: input.kind, orderId: input.orderId, result });
  }
}

async function sendEmailNotification(input: {
  orderId: string;
  kind: NotifyKind;
  email: string;
  subject: string;
  html: string;
  fingerprint?: string | null;
}): Promise<void> {
  if (await wasAlreadySent(input.orderId, input.kind, "email", input.fingerprint)) {
    return;
  }

  const result = await sendResendEmail({
    to: input.email,
    subject: input.subject,
    html: input.html,
  });

  if (!result.ok && result.reason === "not_configured") {
    return;
  }

  await recordNotification({
    orderId: input.orderId,
    kind: input.kind,
    channel: "email",
    recipient: input.email,
    fingerprint: input.fingerprint ?? null,
    status: result.ok ? "sent" : "failed",
    detail: result.ok ? undefined : result.detail,
  });

  if (!result.ok) {
    serverLogger.warn("notify_email_failed", { kind: input.kind, orderId: input.orderId, result });
  }
}

async function dispatchOrderNotification(
  orderId: string,
  kind: NotifyKind,
  build: (ctx: OrderNotifyContext) => {
    sms: string;
    email: ReturnType<typeof buildOrderPlacedEmail>;
    template?: string;
    templateTokens?: string[];
  },
  fingerprint?: string | null
): Promise<void> {
  if (!serverEnv.notifyEnabled) return;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: orderNotifyInclude,
  });
  if (!order) return;

  const phone = resolveNotifyPhone(order);
  const ctx: OrderNotifyContext = {
    orderId: order.id,
    total: order.total,
    customerName: customerDisplayName(order),
    trackingCode: order.trackingCode,
  };
  const content = build(ctx);

  if (phone) {
    await sendSmsNotification({
      orderId,
      kind,
      phone,
      message: content.sms,
      template: content.template,
      templateTokens: content.templateTokens,
      fingerprint,
    });
  }

  const email = order.user.email?.trim();
  if (email) {
    await sendEmailNotification({
      orderId,
      kind,
      email,
      subject: content.email.subject,
      html: content.email.html,
      fingerprint,
    });
  }
}

/** پس از پرداخت موفق — سفارش ثبت شد */
export function notifyOrderPlaced(orderId: string): void {
  void dispatchOrderNotification(orderId, "order_placed", (ctx) => ({
    sms: buildOrderPlacedSms(ctx),
    email: buildOrderPlacedEmail(ctx),
    template: serverEnv.kavenegarTemplateOrderPlaced || undefined,
    templateTokens: serverEnv.kavenegarTemplateOrderPlaced
      ? [ctx.orderId, formatPriceShort(ctx.total)]
      : undefined,
  })).catch((error) => serverLogger.error("notify_order_placed_failed", { orderId }, error));
}

/** وضعیت «ارسال شد» */
export function notifyOrderShipped(orderId: string): void {
  void dispatchOrderNotification(orderId, "order_shipped", (ctx) => ({
    sms: buildOrderShippedSms(ctx),
    email: buildOrderShippedEmail(ctx),
    template: serverEnv.kavenegarTemplateOrderShipped || undefined,
    templateTokens: serverEnv.kavenegarTemplateOrderShipped
      ? [ctx.orderId, ctx.trackingCode ?? "—"]
      : undefined,
  })).catch((error) => serverLogger.error("notify_order_shipped_failed", { orderId }, error));
}

/** به‌روزرسانی کد رهگیری پس از ارسال */
export function notifyOrderTrackingUpdated(orderId: string, trackingCode: string): void {
  void dispatchOrderNotification(
    orderId,
    "order_tracking",
    (ctx) => ({
      sms: buildOrderShippedSms({ ...ctx, trackingCode }),
      email: buildOrderShippedEmail({ ...ctx, trackingCode }),
      template: serverEnv.kavenegarTemplateOrderShipped || undefined,
      templateTokens: serverEnv.kavenegarTemplateOrderShipped
        ? [ctx.orderId, trackingCode]
        : undefined,
    }),
    trackingCode
  ).catch((error) => serverLogger.error("notify_order_tracking_failed", { orderId }, error));
}

function formatPriceShort(total: number): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(total);
}

/** فراخوانی پس از تغییر وضعیت/رهگیری توسط ادمین */
export function notifyOrderAdminUpdate(input: {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  previousTracking: string | null;
  newTracking: string | null;
}): void {
  const becameShipped =
    input.newStatus === "shipped" && input.previousStatus !== "shipped";
  const trackingChanged =
    (input.newTracking ?? "") !== (input.previousTracking ?? "") &&
    Boolean(input.newTracking) &&
    input.newStatus === "shipped";

  if (becameShipped) {
    notifyOrderShipped(input.orderId);
    return;
  }

  if (trackingChanged && input.previousStatus === "shipped") {
    notifyOrderTrackingUpdated(input.orderId, input.newTracking!);
  }
}
