import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  getEdgeSessionFromAccessToken,
  getEdgeSessionFromRequest,
  parseSessionCookieValue,
} from "@/lib/server/auth/session-edge";
import { SESSION_COOKIE_NAME, SESSION_ALG } from "@/lib/server/auth/session-constants";

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

async function signTestAccessToken(claims: {
  sid: string;
  uid: string;
  role: "user" | "admin";
  sth: string;
}) {
  return new SignJWT({ ...claims, uid: claims.uid, role: claims.role })
    .setProtectedHeader({ alg: SESSION_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(secret);
}

describe("parseSessionCookieValue", () => {
  it("splits refresh and access tokens", () => {
    expect(parseSessionCookieValue("refreshpart.accesspart")).toEqual({
      rawRefreshToken: "refreshpart",
      accessToken: "accesspart",
    });
  });

  it("returns null for malformed cookie", () => {
    expect(parseSessionCookieValue("no-dot")).toBeNull();
  });
});

describe("getEdgeSessionFromAccessToken", () => {
  it("reads uid and role from JWT", async () => {
    const accessToken = await signTestAccessToken({
      sid: "sess-1",
      uid: "user-1",
      role: "admin",
      sth: "hash-abc",
    });
    const session = await getEdgeSessionFromAccessToken(accessToken);
    expect(session).toEqual({
      userId: "user-1",
      role: "admin",
      sessionId: "sess-1",
    });
  });

  it("rejects token without uid/role claims", async () => {
    const legacy = await new SignJWT({ sid: "s1", sth: "h1" })
      .setProtectedHeader({ alg: SESSION_ALG })
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(secret);
    expect(await getEdgeSessionFromAccessToken(legacy)).toBeNull();
  });
});

describe("getEdgeSessionFromRequest", () => {
  it("reads session from request cookies", async () => {
    const accessToken = await signTestAccessToken({
      sid: "sess-2",
      uid: "user-2",
      role: "user",
      sth: "hash-def",
    });
    const request = new NextRequest("http://localhost/account", {
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=refresh.${accessToken}`,
      },
    });
    const session = await getEdgeSessionFromRequest(request);
    expect(session?.userId).toBe("user-2");
    expect(session?.role).toBe("user");
  });
});
