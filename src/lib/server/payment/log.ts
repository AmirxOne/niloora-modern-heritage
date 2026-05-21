import type { Prisma } from "@prisma/client";
import { serverLogger } from "@/lib/observability/logger";
import { prisma } from "@/lib/server/prisma";

type PaymentLogInput = {
  paymentId?: string;
  orderId?: string;
  level: "info" | "error";
  event: string;
  message?: string;
  meta?: Record<string, unknown>;
};

export async function logPaymentEvent(input: PaymentLogInput) {
  try {
    await prisma.paymentLog.create({
      data: {
        paymentId: input.paymentId ?? null,
        orderId: input.orderId ?? null,
        level: input.level,
        event: input.event,
        message: input.message ?? null,
        meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    serverLogger.error("payment_log_persist_failed", { event: input.event }, error);
  }
}
