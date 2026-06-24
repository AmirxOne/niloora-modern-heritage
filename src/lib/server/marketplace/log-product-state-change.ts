import type { Prisma, ProductPublicationStatus } from "@prisma/client";
import type { ProductModerationAction } from "@/lib/server/marketplace/product-state-machine";

type PrismaTx = Prisma.TransactionClient;

export type LogProductStateChangeInput = {
  productId: string;
  vendorId?: string | null;
  actorUserId?: string | null;
  actorRole: string;
  fromStatus: ProductPublicationStatus | null;
  toStatus: ProductPublicationStatus;
  action: ProductModerationAction;
  note?: string | null;
};

export async function logProductStateChange(
  tx: PrismaTx,
  input: LogProductStateChangeInput
): Promise<void> {
  await tx.productModerationEvent.create({
    data: {
      productId: input.productId,
      vendorId: input.vendorId ?? null,
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      action: input.action,
      note: input.note ?? null,
    },
  });
}
