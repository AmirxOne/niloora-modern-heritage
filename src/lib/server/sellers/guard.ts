import { prisma } from "@/lib/server/prisma";
import { unauthorized, forbidden } from "@/lib/server/http";
import type { Seller } from "@prisma/client";

/**
 * SELLER GUARD — resolves the caller's active Seller account.
 * Rules:
 * - must be logged in (role "seller" or any role with a linked Seller row)
 * - seller status must be "active" (pending/suspended sellers get 403)
 */
export async function readActiveSeller(): Promise<
  { ok: true; seller: Seller } | { ok: false; response: Response }
> {
  // lazy import to avoid circular dependency with session.ts
  const { readSessionUser } = await import("@/lib/server/auth/session");
  const user = await readSessionUser();
  if (!user) return { ok: false, response: unauthorized() };

  const seller = await prisma.seller.findUnique({
    where: { userId: user.id },
  });
  if (!seller) {
    return { ok: false, response: forbidden("فروشنده‌ای به این حساب متصل نیست.") };
  }
  if (seller.status !== "active") {
    return {
      ok: false,
      response: forbidden("فروشگاه شما فعال نیست یا به‌طور موقت متوقف شده است."),
    };
  }
  return { ok: true, seller };
}
