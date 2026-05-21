import { hash } from "bcryptjs";
import { normalizeIranPhone } from "@/lib/auth/phone";
import { prisma } from "@/lib/server/prisma";
import { conflict, created, badRequest, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { createSession, setSessionCookie } from "@/lib/server/auth/session";
import { toSessionUser } from "@/lib/server/auth/dto";

type Body = {
  name?: string;
  phone?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const name = body.name?.trim() ?? "";
    const phone = normalizeIranPhone(body.phone ?? "");
    const password = body.password ?? "";

    if (!name || !phone || password.length < 6) {
      return badRequest("Invalid registration payload");
    }

    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return conflict("phone_exists");
    }

    const passwordHash = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        role: "user",
        passwordHash,
      },
    });

    const sessionToken = await createSession(user.id);
    await setSessionCookie(sessionToken);

    return created({ user: toSessionUser(user) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/auth/register" });
  }
}
