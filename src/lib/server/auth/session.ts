import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/server/prisma";
import { serverEnv } from "@/lib/server/env";
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
  if (!parsed) return null;

  const refreshTokenHash = hashToken(parsed.rawRefreshToken);

  try {
    const { payload } = await verifyAccessTokenLoose(parsed.accessToken);
    const sessionId = typeof payload.sid === "string" ? payload.sid : null;
    const tokenRefreshHash = typeof payload.sth === "string" ? payload.sth : null;
    if (!sessionId || !tokenRefreshHash || tokenRefreshHash !== refreshTokenHash) return null;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt.getTime() <= Date.now()) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }

    const expSec = typeof payload.exp === "number" ? payload.exp : 0;
    const isAccessExpired = expSec > 0 && expSec * 1000 <= Date.now();
    if (isAccessExpired) {
      const newAccessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
      const newAccessToken = await signAccessToken(session.id, refreshTokenHash, newAccessExpiresAt, {
        uid: session.user.id,
        role: toSessionRole(session.user.role),
      });
      const remainingRefreshSec = Math.max(
        1,
        Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
      );
      await setSessionCookie(`${parsed.rawRefreshToken}.${newAccessToken}`, remainingRefreshSec);
    }

    return session.user;
  } catch {
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

export async function setSessionCookie(value: string, maxAgeSec?: number) {
  // PURPOSE: central cookie policy for all auth entrypoints.
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec ?? refreshTtlMs() / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
