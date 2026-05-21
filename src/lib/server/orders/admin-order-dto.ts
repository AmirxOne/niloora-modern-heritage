import { toOrderDto, type orderInclude } from "@/lib/server/orders/order-dto";
import type { Prisma } from "@prisma/client";

type AdminOrderRecord = Prisma.OrderGetPayload<{
  include: typeof orderInclude & {
    user: { select: { name: true; phone: true } };
  };
}>;

export function toAdminOrderDto(order: AdminOrderRecord) {
  return {
    ...toOrderDto(order),
    customer: {
      name: order.user.name,
      phone: order.user.phone,
    },
  };
}
