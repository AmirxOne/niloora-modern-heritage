import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, notFound, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  deleteTestimonial,
  mapTestimonial,
  updateTestimonial,
} from "@/lib/server/home/home-testimonials";
import { prisma } from "@/lib/server/prisma";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.homeTestimonial.findUnique({ where: { id } });
    if (!existing) return notFound("نظر یافت نشد.");

    const body = (await request.json()) as Record<string, unknown>;
    const row = await updateTestimonial(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      location: typeof body.location === "string" ? body.location : undefined,
      text: typeof body.text === "string" ? body.text : undefined,
      rating: body.rating !== undefined ? Number(body.rating) : undefined,
      sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) : undefined,
    });

    return ok({ testimonial: mapTestimonial(row) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/testimonials/[id]" });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { id } = await context.params;
    const existing = await prisma.homeTestimonial.findUnique({ where: { id } });
    if (!existing) return notFound("نظر یافت نشد.");

    await deleteTestimonial(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/testimonials/[id]" });
  }
}
