import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Prisma } from "@prisma/client";
import type { NextResponse } from "next/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";
import { isPrismaMissingTableOrColumn } from "@/lib/server/prisma-schema-drift";
import {
  ACCESS_TOKEN_TTL_MS,
  SESSION_ALG,
  SESSION_COOKIE_NAME,
  type SessionRole,
} from "@/lib/server/auth/session-constants";

/**
 * Session model:
 * cookie = "<rawRefreshToken>.<signedAccessToken>"
 * Access token is short-lived; refresh token hash + DB session row are the trust anchor.
 */
const COOKIE_NAME = SESSION_COOKIE_NAME;
const encoder = new TextEncoder();
const secret = encoder.encode(serverEnv.sessionSecret);

/** Core user fields for session validation — avoids optional columns missing in drifted DBs. */
const sessionUserSelectWithoutBlocked = {
  id: true,
  name: true,
  phone: true,
  referralCode: true,
  signupIpHash: true,
  referredById: true,
  referralCredit: true,
  referralEarnedTotal: true,
  passwordHash: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  postalCode: true,
  addressLine: true,
  province: true,
  city: true,
  nationalCode: true,
  landlinePhone: true,
  gender: true,
  role: true,
  memberSince: true,
  tier: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const sessionUserSelectWithBlocked = {
  ...sessionUserSelectWithoutBlocked,
  blocked: true,
} satisfies Prisma.UserSelect;

type SessionUserRow = Prisma.UserGetPayload<{ select: typeof sessionUserSelectWithoutBlocked }> & {
  blocked?: boolean;
};

function coerceLegacySessionUser(user: SessionUserRow): User {
  return {
    ...user,
    blocked: user.blocked ?? false,
    favoriteStone: null,
    favoriteStyle: null,
    favoriteBudgetBand: null,
    loyaltyPoints: 0,
    loyaltyTier: "bronze",
    loyaltyLifetimeSpend: 0,
  } as User;
}

async function loadSessionWithUser(sessionId: string) {
  try {
    return await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        expiresAt: true,
        user: { select: sessionUserSelectWithBlocked },
      },
    });
  } catch (error) {
    if (!isPrismaMissingTableOrColumn(error, "blocked")) throw error;
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        expiresAt: true,
        user: { select: sessionUserSelectWithoutBlocked },
      },
    });
    if (!session?.user) return session;
    return {
      ...session,
      user: { ...session.user, blocked: false },
    };
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function refreshTtlMs(): number {
  return serverEnv.sessionMaxAgeDays * 24 * 60 * 60 * 1000;
}

function parseSessionCookie(cookieValue: string): { rawRefreshToken: string; accessToken: string } | null {
  const firstDot = cookieValue.indexOf(".");
  if (firstDot <= 0) return null;
  const rawRefreshToken = cookieValue.slice(0, firstDot);
  const accessToken = cookieValue.slice(firstDot + 1);
  if (!rawRefreshToken || !accessToken) return null;
  return { rawRefreshToken, accessToken };
}

function toSessionRole(role: string): SessionRole {
  if (role === "admin" || role === "editor" || role === "reviewer") return role;
  return "user";
}

async function signAccessToken(
  sessionId: string,
  refreshTokenHash: string,
  expiresAt: Date,
  claims: { uid: string; role: SessionRole }
): Promise<string> {
  return new SignJWT({
    sid: sessionId,
    sth: refreshTokenHash,
    uid: claims.uid,
    role: claims.role,
  })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secret);
}

async function verifyAccessTokenLoose(accessToken: string) {
  const maxClockToleranceSec = Math.max(1, Math.floor(refreshTtlMs() / 1000));
  return jwtVerify(accessToken, secret, {
    algorithms: [SESSION_ALG],
    clockTolerance: maxClockToleranceSec,
  });
}

export async function createSession(userId: string): Promise<string> {
  // FLOW: issue long-lived refresh credential + short-lived access token (1 day).
  const rawRefreshToken = randomBytes(32).toString("hex");
  const refreshTokenHash = hashToken(rawRefreshToken);
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs());

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) {
    throw new Error("User not found for session");
  }

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: refreshExpiresAt,
    },
  });

  const accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
  const accessToken = await signAccessToken(session.id, refreshTokenHash, accessExpiresAt, {
    uid: user.id,
    role: toSessionRole(user.role),
  });

  return `${rawRefreshToken}.${accessToken}`;
}

export async function readSessionUser() {
  // BOUNDARY: cookie alone is not trusted; refresh hash + signed access token + DB session must all match.
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) return null;
  const parsed = parseSessionCookie(cookieValue);
  if (!parsed) {
    await clearSessionCookie();
    return null;
  }

  const refreshTokenHash = hashToken(parsed.rawRefreshToken);

  try {
    const { payload } = await verifyAccessTokenLoose(parsed.accessToken);
    const sessionId = typeof payload.sid === "string" ? payload.sid : null;
    const tokenRefreshHash = typeof payload.sth === "string" ? payload.sth : null;
    if (!sessionId || !tokenRefreshHash || tokenRefreshHash !== refreshTokenHash) return null;

    let session;
    try {
      session = await loadSessionWithUser(sessionId);
    } catch {
      await clearSessionCookie();
      return null;
    }
    if (!session) {
      await clearSessionCookie();
      return null;
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      await clearSessionCookie();
      return null;
    }

    const sessionUser = coerceLegacySessionUser(session.user);

    if (sessionUser.blocked) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      await clearSessionCookie();
      return null;
    }

    const expSec = typeof payload.exp === "number" ? payload.exp : 0;
    const isAccessExpired = expSec > 0 && expSec * 1000 <= Date.now();
    if (isAccessExpired) {
      const newAccessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
      const newAccessToken = await signAccessToken(session.id, refreshTokenHash, newAccessExpiresAt, {
        uid: sessionUser.id,
        role: toSessionRole(sessionUser.role),
      });
      const remainingRefreshSec = Math.max(
        1,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
      );
      await setSessionCookie(`${parsed.rawRefreshToken}.${newAccessToken}`, remainingRefreshSec);
    }

    return sessionUser;
  } catch {
    await clearSessionCookie();
    return null;
  }
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) return;
  const parsed = parseSessionCookie(cookieValue);
  if (!parsed) return;

  try {
    const { payload } = await verifyAccessTokenLoose(parsed.accessToken);
    const sessionId = typeof payload.sid === "string" ? payload.sid : null;
    if (sessionId) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => undefined);
    }
  } catch {
    // ignore invalid cookie
  }
}

function sessionCookieOptions(maxAgeSec?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec ?? refreshTtlMs() / 1000,
  };
}

export async function setSessionCookie(value: string, maxAgeSec?: number) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, sessionCookieOptions(maxAgeSec));
}

/** Ensures Set-Cookie is attached to the route handler response (Next.js App Router). */
export function applySessionCookieToResponse(
  response: NextResponse,
  value: string,
  maxAgeSec?: number
) {
  response.cookies.set(COOKIE_NAME, value, sessionCookieOptions(maxAgeSec));
  return response;
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
