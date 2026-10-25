import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";

/**
 * SECURITY BOUNDARY (guest-checkout fix):
 * Never issue a session for a user whose account the caller did not
 * authenticate as. Guest checkout resolves the order owner purely from the
 * shipping phone number, so anyone can pay "as" someone else's phone. Only
 * account holders whose account has no usable password (guest/OTP-only,
 * marker prefixes GUEST_/OTP_ONLY_) may be auto-logged-in after a successful
 * payment on their own order; everyone else is redirected to the normal OTP
 * login. Anonymous users keep browsing without a session.
 */
const AUTO_LOGIN_PREFIXES = ["GUEST_", "OTP_ONLY_"];

export function isAutoLoginEligible(passwordHash: string): boolean {
  return AUTO_LOGIN_PREFIXES.some((prefix) => passwordHash.startsWith(prefix));
}

export async function maybeCreatePostCheckoutSession(
  userId: string
): Promise<{ sessionCreated: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user || !isAutoLoginEligible(user.passwordHash)) {
    return { sessionCreated: false };
  }

  const sessionToken = await createSession(userId);
  await setSessionCookie(sessionToken);
  return { sessionCreated: true };
}
