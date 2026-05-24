import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import {
  SESSION_ALG,
  SESSION_COOKIE_NAME,
  type SessionRole,
} from "@/lib/server/auth/session-constants";

export type EdgeSession = {
  userId: string;
  role: SessionRole;
  sessionId: string;
};

export function parseSessionCookieValue(
  cookieValue: string
): { rawRefreshToken: string; accessToken: string } | null {
  const firstDot = cookieValue.indexOf(".");
  if (firstDot <= 0) return null;
  const rawRefreshToken = cookieValue.slice(0, firstDot);
  const accessToken = cookieValue.slice(firstDot + 1);
  if (!rawRefreshToken || !accessToken) return null;
  return { rawRefreshToken, accessToken };
}

function sessionSecret(): Uint8Array | null {
  const raw = process.env.SESSION_SECRET?.trim();
  if (!raw) return null;
  return new TextEncoder().encode(raw);
}

export async function getEdgeSessionFromAccessToken(
  accessToken: string
): Promise<EdgeSession | null> {
  const secret = sessionSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(accessToken, secret, {
      algorithms: [SESSION_ALG],
    });

    const sessionId = typeof payload.sid === "string" ? payload.sid : null;
    const userId = typeof payload.uid === "string" ? payload.uid : null;
    const role: SessionRole | null =
      payload.role === "admin" ||
      payload.role === "editor" ||
      payload.role === "reviewer" ||
      payload.role === "user"
        ? payload.role
        : null;

    if (!sessionId || !userId || !role) return null;

    return { userId, role, sessionId };
  } catch {
    return null;
  }
}

export async function getEdgeSessionFromRequest(
  request: NextRequest
): Promise<EdgeSession | null> {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) return null;

  const parsed = parseSessionCookieValue(cookieValue);
  if (!parsed) return null;

  return getEdgeSessionFromAccessToken(parsed.accessToken);
}
