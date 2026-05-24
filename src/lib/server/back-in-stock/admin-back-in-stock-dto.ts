import type { Prisma } from "@prisma/client";
import type { AdminBackInStockAlert } from "@/lib/types";

const alertInclude = {
  product: {
    select: {
      id: true,
      name: true,
      namePersian: true,
      image: true,
    },
  },
} satisfies Prisma.BackInStockAlertInclude;

export type DbBackInStockAlertAdmin = Prisma.BackInStockAlertGetPayload<{
  include: typeof alertInclude;
}>;

export { alertInclude as backInStockAlertAdminInclude };

export function toAdminBackInStockAlertDto(row: DbBackInStockAlertAdmin): AdminBackInStockAlert {
  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId ?? undefined,
    name: row.name ?? undefined,
    channel: row.channel as AdminBackInStockAlert["channel"],
    contact: row.contact,
    status: row.status as AdminBackInStockAlert["status"],
    sourceAvailability: (row.sourceAvailability as AdminBackInStockAlert["sourceAvailability"]) ?? undefined,
    requestedAt: row.requestedAt.toISOString(),
    notifiedAt: row.notifiedAt?.toISOString(),
    notifyAttempts: row.notifyAttempts,
    lastError: row.lastError ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    productName: row.product.name,
    productNamePersian: row.product.namePersian,
    productImage: row.product.image,
  };
}
