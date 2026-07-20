import { prisma } from "@/lib/server/prisma";

export type VendorOrderLineDto = {
  orderItemId: string;
  orderId: string;
  orderStatus: string;
  orderTotal: number;
  orderDate: string;
  shippingName?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
};

function mapVendorOrderLine(item: {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  quantity: number;
  price: number;
  order: {
    status: string;
    total: number;
    createdAt: Date;
    shippingName: string | null;
  };
}): VendorOrderLineDto {
  return {
    orderItemId: item.id,
    orderId: item.orderId,
    orderStatus: item.order.status,
    orderTotal: item.order.total,
    orderDate: item.order.createdAt.toISOString(),
    shippingName: item.order.shippingName ?? undefined,
    productId: item.productId ?? undefined,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  };
}

export async function listVendorOrderLines(vendorId: string, limit = 100): Promise<VendorOrderLineDto[]> {
  const items = await prisma.orderItem.findMany({
    where: { vendorId },
    include: {
      order: {
        select: {
          status: true,
          total: true,
          createdAt: true,
          shippingName: true,
        },
      },
    },
    orderBy: { order: { createdAt: "desc" } },
    take: limit,
  });

  return items.map(mapVendorOrderLine);
}

export function vendorOrdersSince(days: number): Date {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since;
}

export async function countVendorOrdersSince(vendorId: string, since: Date): Promise<number> {
  const rows = await prisma.orderItem.findMany({
    where: {
      vendorId,
      order: { createdAt: { gte: since } },
    },
    select: { orderId: true },
    distinct: ["orderId"],
  });
  return rows.length;
}

export async function sumVendorGrossSince(vendorId: string, since: Date): Promise<number> {
  const items = await prisma.orderItem.findMany({
    where: {
      vendorId,
      order: { createdAt: { gte: since } },
    },
    select: { price: true, quantity: true },
  });
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
