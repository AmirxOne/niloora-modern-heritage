import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import {
  giftCardIsExpired,
  isGiftCardCodeShape,
  newGiftCardCode,
  normalizeGiftCardCode,
} from "@/lib/server/gift-card/gift-card";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

type ActiveGiftCard = {
  id: string;
  code: string;
  remainingAmount: number;
  initialAmount: number;
  active: boolean;
  expiresAt: Date | null;
};

function toActiveGiftCard(row: ActiveGiftCard) {
  return {
    id: row.id,
    code: row.code,
    remainingAmount: row.remainingAmount,
    initialAmount: row.initialAmount,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

export async function createGiftCard(input: {
  amount: number;
  note?: string | null;
  recipientName?: string | null;
  recipientContact?: string | null;
  purchaserUserId?: string | null;
  orderId?: string | null;
  tx?: PrismaTx;
}) {
  const txClient = input.tx ?? prisma;
  for (let i = 0; i < 5; i += 1) {
    const code = newGiftCardCode();
    try {
      const row = await txClient.giftCard.create({
        data: {
          code,
          initialAmount: input.amount,
          remainingAmount: input.amount,
          note: input.note?.trim() || null,
          recipientName: input.recipientName?.trim() || null,
          recipientContact: input.recipientContact?.trim() || null,
          purchaserUserId: input.purchaserUserId ?? null,
          orderId: input.orderId ?? null,
          active: true,
        },
      });
      await txClient.giftCardTransaction.create({
        data: {
          giftCardId: row.id,
          type: "issue",
          amount: input.amount,
          description: input.orderId ? `Issued from order ${input.orderId}` : "Issued manually",
        },
      });
      return toActiveGiftCard(row);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code: string }).code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("gift_card_code_generation_failed");
}

export async function getGiftCardByCode(rawCode: string) {
  const code = normalizeGiftCardCode(rawCode);
  if (!isGiftCardCodeShape(code)) return null;
  const row = await prisma.giftCard.findUnique({
    where: { code },
    select: {
      id: true,
      code: true,
      initialAmount: true,
      remainingAmount: true,
      active: true,
      expiresAt: true,
    },
  });
  if (!row) return null;
  return toActiveGiftCard(row);
}

export async function validateGiftCardForCheckout(codeInput: string, payableBeforeGiftCard: number) {
  const card = await getGiftCardByCode(codeInput);
  if (!card) return { valid: false as const, reason: "not_found" as const };
  if (!card.active) return { valid: false as const, reason: "inactive" as const };
  if (giftCardIsExpired(card.expiresAt ? new Date(card.expiresAt) : null)) {
    return { valid: false as const, reason: "expired" as const };
  }
  if (card.remainingAmount <= 0) return { valid: false as const, reason: "empty" as const };
  const appliedAmount = Math.min(card.remainingAmount, Math.max(0, payableBeforeGiftCard));
  return {
    valid: true as const,
    giftCard: card,
    appliedAmount,
    payableAfter: Math.max(0, payableBeforeGiftCard - appliedAmount),
  };
}

export async function consumeGiftCardForOrder(input: {
  code: string;
  orderId: string;
  amount: number;
  tx?: PrismaTx;
}) {
  if (input.amount <= 0) return null;
  const code = normalizeGiftCardCode(input.code);
  const run = async (tx: PrismaTx) => {
    const card = await tx.giftCard.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        remainingAmount: true,
        active: true,
        expiresAt: true,
      },
    });
    if (!card || !card.active || card.remainingAmount <= 0 || giftCardIsExpired(card.expiresAt)) {
      return null;
    }
    const applyAmount = Math.min(card.remainingAmount, input.amount);
    if (applyAmount <= 0) return null;

    const nextRemaining = card.remainingAmount - applyAmount;
    await tx.giftCard.update({
      where: { id: card.id },
      data: {
        remainingAmount: nextRemaining,
        active: nextRemaining > 0,
      },
    });
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        orderId: input.orderId,
        type: "redeem",
        amount: applyAmount,
        description: `Redeemed on order ${input.orderId}`,
      },
    });
    await tx.order.update({
      where: { id: input.orderId },
      data: {
        giftCardCode: card.code,
        giftCardAppliedAmount: applyAmount,
      },
    });
    return { code: card.code, appliedAmount: applyAmount, remainingAmount: nextRemaining };
  };
  if (input.tx) return run(input.tx);
  return prisma.$transaction(async (tx) => run(tx));
}

export async function listAdminGiftCards() {
  const rows = await prisma.giftCard.findMany({
    include: {
      purchaser: { select: { id: true, phone: true } },
      order: { select: { id: true } },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    initialAmount: row.initialAmount,
    remainingAmount: row.remainingAmount,
    active: row.active,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    note: row.note ?? "",
    recipientName: row.recipientName ?? "",
    recipientContact: row.recipientContact ?? "",
    purchaserUserId: row.purchaserUserId ?? "",
    purchaserPhone: row.purchaser?.phone ?? "",
    orderId: row.orderId ?? "",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    transactions: row.transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description ?? "",
      orderId: t.orderId ?? "",
      createdAt: t.createdAt.toISOString(),
    })),
  }));
}
