import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

type PrismaTx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

const REFERRAL_REWARD_INVITER = 150_000;
const REFERRAL_REWARD_INVITEE = 100_000;
const REFERRAL_MAX_PER_IP = 3;

export function normalizeReferralCode(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isValidReferralCode(value: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(value);
}

export function buildReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function readRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.trim() ?? "";
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return request.headers.get("x-real-ip")?.trim() ?? "";
}

export function hashIp(ip: string): string | null {
  const value = ip.trim();
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

type ApplyReferralInput = {
  tx: PrismaTx;
  inviteeId: string;
  referralCode: string;
  inviteIpHash: string | null;
};

export async function applyReferralForUser(input: ApplyReferralInput) {
  const code = normalizeReferralCode(input.referralCode);
  if (!isValidReferralCode(code)) return;

  const inviter = await input.tx.user.findUnique({
    where: { referralCode: code },
    select: { id: true, signupIpHash: true },
  });
  if (!inviter || inviter.id === input.inviteeId) return;

  const invitee = await input.tx.user.findUnique({
    where: { id: input.inviteeId },
    select: { id: true, referredById: true, signupIpHash: true },
  });
  if (!invitee || invitee.referredById) return;

  const existing = await input.tx.referralInvite.findUnique({
    where: { inviteeId: input.inviteeId },
    select: { id: true },
  });
  if (existing) return;

  const sameSignupIp =
    Boolean(invitee.signupIpHash) &&
    Boolean(inviter.signupIpHash) &&
    invitee.signupIpHash === inviter.signupIpHash;

  const tooManyFromIp = input.inviteIpHash
    ? (await input.tx.referralInvite.count({
        where: { inviteIpHash: input.inviteIpHash },
      })) >= REFERRAL_MAX_PER_IP
    : false;

  if (sameSignupIp || tooManyFromIp) {
    await input.tx.referralInvite.create({
      data: {
        inviterId: inviter.id,
        inviteeId: input.inviteeId,
        referralCodeUsed: code,
        status: "blocked",
        antiFraudReason: sameSignupIp ? "same_signup_ip" : "ip_limit_reached",
        inviteIpHash: input.inviteIpHash,
      },
    });
    return;
  }

  await input.tx.user.update({
    where: { id: input.inviteeId },
    data: { referredById: inviter.id },
  });

  await input.tx.referralInvite.create({
    data: {
      inviterId: inviter.id,
      inviteeId: input.inviteeId,
      referralCodeUsed: code,
      status: "registered",
      inviteIpHash: input.inviteIpHash,
    },
  });
}

export async function rewardReferralOnPaidOrder(tx: PrismaTx, orderId: string) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true, createdAt: true },
  });
  if (!order) return;
  if (!["processing", "crafting", "shipped", "delivered"].includes(order.status)) return;

  const invite = await tx.referralInvite.findUnique({
    where: { inviteeId: order.userId },
    select: { id: true, inviterId: true, status: true, rewardedAt: true },
  });
  if (!invite || invite.status !== "registered" || invite.rewardedAt) return;

  const previousPaid = await tx.order.findFirst({
    where: {
      userId: order.userId,
      id: { not: order.id },
      status: { in: ["processing", "crafting", "shipped", "delivered"] },
      createdAt: { lt: order.createdAt },
    },
    select: { id: true },
  });
  if (previousPaid) return;

  const inviteUpdate = await tx.referralInvite.updateMany({
    where: { id: invite.id, status: "registered", rewardedAt: null },
    data: {
      status: "rewarded",
      rewardedAt: new Date(),
      inviteeFirstOrderId: order.id,
      inviterReward: REFERRAL_REWARD_INVITER,
      inviteeReward: REFERRAL_REWARD_INVITEE,
    },
  });
  if (inviteUpdate.count === 0) return;

  await tx.user.update({
    where: { id: invite.inviterId },
    data: {
      referralCredit: { increment: REFERRAL_REWARD_INVITER },
      referralEarnedTotal: { increment: REFERRAL_REWARD_INVITER },
    },
  });
  await tx.user.update({
    where: { id: order.userId },
    data: {
      referralCredit: { increment: REFERRAL_REWARD_INVITEE },
      referralEarnedTotal: { increment: REFERRAL_REWARD_INVITEE },
    },
  });
}
