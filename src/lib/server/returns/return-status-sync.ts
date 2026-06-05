import {
  mapReturnStatusToSupportStatus,
  mapSupportStatusToReturnStatus,
} from "@/lib/returns/workflow";
import type { OrderReturnStatus } from "@/lib/server/returns/order-return";
import type { SupportRequestStatus } from "@/lib/server/support-request/support-request";

type PrismaTx = Omit<
  import("@prisma/client").PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

export async function syncSupportRequestFromReturnStatus(
  tx: PrismaTx,
  supportRequestId: string,
  returnStatus: OrderReturnStatus
) {
  const nextSupportStatus = mapReturnStatusToSupportStatus(returnStatus);
  await tx.supportRequest.update({
    where: { id: supportRequestId },
    data: { status: nextSupportStatus },
  });
}

export async function syncReturnFromSupportStatus(
  tx: PrismaTx,
  returnId: string,
  currentReturnStatus: OrderReturnStatus,
  supportStatus: SupportRequestStatus,
  changedById?: string | null
) {
  const nextReturnStatus = mapSupportStatusToReturnStatus(supportStatus, currentReturnStatus);
  if (!nextReturnStatus || nextReturnStatus === currentReturnStatus) return;

  await tx.orderReturn.update({
    where: { id: returnId },
    data: { status: nextReturnStatus },
  });
  await tx.orderReturnStatusHistory.create({
    data: {
      returnId,
      fromStatus: currentReturnStatus,
      toStatus: nextReturnStatus,
      note: "همگام‌سازی از وضعیت تیکت پشتیبانی",
      changedById: changedById ?? null,
    },
  });
}

export async function loadLinkedReturnBySupportRequestId(supportRequestId: string) {
  const { prisma } = await import("@/lib/server/prisma");
  return prisma.orderReturn.findFirst({
    where: { supportRequestId },
    select: { id: true, status: true },
  });
}
