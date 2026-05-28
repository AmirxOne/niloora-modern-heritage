import type { Prisma } from "@prisma/client";
import { shippingMethodLabel } from "@/lib/orders/shipping-methods";
import type { CartItem, OrderShipping } from "@/lib/types";
import { normalizeLoyaltyTier } from "@/lib/loyalty/program";

type OrderWithItems = {
  id: string;
  status: string;
  total: number;
  subtotalList: number | null;
  totalFurooh: number | null;
  bundleDiscount: number | null;
  appliedBundles: Prisma.JsonValue;
  promoCode: string | null;
  paymentMethod: string | null;
  installmentMonths: number | null;
  installmentAmount: number | null;
  giftCardCode: string | null;
  giftCardAppliedAmount: number | null;
  loyaltyTier: string | null;
  loyaltyDiscountAmount: number | null;
  loyaltyPointsEarned: number | null;
  campaignId?: string | null;
  campaignDiscountAmount?: number | null;
  campaign?: { title: string; slug: string } | null;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingProvince?: string | null;
  shippingCity?: string | null;
  shippingAddress?: string | null;
  shippingPostalCode?: string | null;
  orderNote?: string | null;
  shippingMethod?: string | null;
  shippingCost?: number | null;
  trackingCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string | null;
    name: string;
    price: number;
    listPrice: number | null;
    quantity: number;
    image: string;
    availability: string | null;
    customizerState: Prisma.JsonValue;
  }>;
  payment?: {
    status: string;
    gateway: string;
    refId: string | null;
    verifiedAt: Date | null;
  } | null;
};

export function toOrderDto(order: OrderWithItems) {
  const shipping: OrderShipping | undefined = order.shippingName
    ? {
        fullName: order.shippingName,
        mobile: order.shippingPhone ?? "",
        province: order.shippingProvince ?? "",
        city: order.shippingCity ?? "",
        address: order.shippingAddress ?? "",
        postalCode: order.shippingPostalCode ?? "",
        orderNote: order.orderNote ?? "",
        method: order.shippingMethod ?? "standard",
        methodLabel: shippingMethodLabel(order.shippingMethod),
        cost: order.shippingCost ?? 0,
      }
    : undefined;

  const payment = order.payment
    ? {
        status: order.payment.status,
        gateway: order.payment.gateway,
        refId: order.payment.refId ?? undefined,
        verifiedAt: order.payment.verifiedAt?.toISOString(),
      }
    : undefined;

  return {
    id: order.id,
    date: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    status: order.status,
    total: order.total,
    subtotalList: order.subtotalList ?? undefined,
    totalFurooh: order.totalFurooh ?? undefined,
    bundleDiscount: order.bundleDiscount ?? undefined,
    appliedBundles:
      (Array.isArray(order.appliedBundles)
        ? (order.appliedBundles as Array<{ id: string; title: string; amount: number }>)
        : undefined),
    promoCode: order.promoCode,
    paymentMethod:
      order.paymentMethod === "bnpl" || order.paymentMethod === "zarinpal"
        ? order.paymentMethod
        : undefined,
    installmentMonths: order.installmentMonths ?? undefined,
    installmentAmount: order.installmentAmount ?? undefined,
    giftCardCode: order.giftCardCode ?? undefined,
    giftCardAppliedAmount: order.giftCardAppliedAmount ?? undefined,
    loyaltyTier: normalizeLoyaltyTier(order.loyaltyTier),
    loyaltyDiscountAmount: order.loyaltyDiscountAmount ?? undefined,
    loyaltyPointsEarned: order.loyaltyPointsEarned ?? undefined,
    campaignId: order.campaignId ?? undefined,
    campaignDiscountAmount: order.campaignDiscountAmount ?? undefined,
    campaignTitle: order.campaign?.title,
    shipping,
    trackingCode: order.trackingCode ?? undefined,
    payment,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      name: item.name,
      price: item.price,
      listPrice: item.listPrice ?? undefined,
      quantity: item.quantity,
      image: item.image,
      availability: (item.availability as CartItem["availability"]) ?? undefined,
      customizerState: (item.customizerState as unknown as CartItem["customizerState"]) ?? undefined,
    })),
  };
}

export const orderInclude = {
  items: true,
  campaign: {
    select: {
      title: true,
      slug: true,
    },
  },
  payment: {
    select: {
      status: true,
      gateway: true,
      refId: true,
      verifiedAt: true,
    },
  },
} as const;
