export { dynamic } from "@/lib/server/route-segment";

import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { readSessionUser } from "@/lib/server/auth/session";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { badRequest, created } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";
import type { CartItem } from "@/lib/types";

type Body = {
  channel?: "sms" | "email";
  contact?: string;
  name?: string;
  cartItems?: CartItem[];
  shipping?: Record<string, unknown> | null;
  checkoutPath?: string;
};

function normalizeContact(channel: "sms" | "email", raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (channel === "sms") {
    return normalizeIranPhone(value);
  }
  const email = value.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export async function POST(request: Request) {
  try {
    if (!serverEnv.abandonedCartEnabled) {
      return badRequest("یادآوری سبد رهاشده غیرفعال است.");
    }

    const user = await readSessionUser();
    const payload = (await request.json()) as Body;

    const channel = payload.channel;
    if (channel !== "sms" && channel !== "email") {
      return badRequest("کانال یادآوری نامعتبر است.");
    }

    const contact = normalizeContact(channel, payload.contact?.trim() ?? "");
    if (!contact) {
      return badRequest(channel === "sms" ? "شماره موبایل معتبر نیست." : "ایمیل معتبر نیست.");
    }

    const cartItems = Array.isArray(payload.cartItems) ? payload.cartItems : [];
    if (cartItems.length === 0) {
      return badRequest("سبد خرید خالی است.");
    }

    const checkoutPath =
      payload.checkoutPath?.trim() && payload.checkoutPath.startsWith("/")
        ? payload.checkoutPath
        : "/cart?step=checkout";
    const now = new Date();
    const nextReminderAt = new Date(
      now.getTime() + serverEnv.abandonedCartReminderDelayMinutes * 60 * 1000
    );

    const token = randomUUID().replace(/-/g, "");
    const row = await prisma.abandonedCartRecovery.upsert({
      where: {
        channel_contact: {
          channel,
          contact,
        },
      },
      create: {
        token,
        userId: user?.id ?? null,
        name: payload.name?.trim() || user?.name || null,
        channel,
        contact,
        status: "pending",
        cartSnapshot: cartItems as unknown as Prisma.InputJsonValue,
        shippingSnapshot: (payload.shipping ?? null) as unknown as Prisma.InputJsonValue,
        checkoutPath,
        lastActivityAt: now,
        nextReminderAt,
      },
      update: {
        ...(user?.id ? { userId: user.id } : {}),
        name: payload.name?.trim() || user?.name || null,
        status: "pending",
        cartSnapshot: cartItems as unknown as Prisma.InputJsonValue,
        shippingSnapshot: (payload.shipping ?? null) as unknown as Prisma.InputJsonValue,
        checkoutPath,
        lastActivityAt: now,
        nextReminderAt,
        recoveredAt: null,
        lastError: null,
      },
    });

    return created({
      recovery: {
        id: row.id,
        token: row.token,
        status: row.status,
        nextReminderAt: row.nextReminderAt?.toISOString(),
      },
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/abandoned-cart" });
  }
}
