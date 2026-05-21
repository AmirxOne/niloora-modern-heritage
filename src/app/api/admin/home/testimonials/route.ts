import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, created, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  createTestimonial,
  listHomeTestimonials,
  mapTestimonial,
} from "@/lib/server/home/home-testimonials";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const testimonials = await listHomeTestimonials();
    return ok({ testimonials });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/testimonials" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name : "";
    const location = typeof body.location === "string" ? body.location : "";
    const text = typeof body.text === "string" ? body.text : "";
    const rating = Number(body.rating ?? 5);

    if (!name.trim() || !text.trim()) {
      return badRequest("نام و متن نظر الزامی است.");
    }

    const row = await createTestimonial({
      name,
      location,
      text,
      rating,
      sortOrder: Number(body.sortOrder ?? 0),
    });

    return created({ testimonial: mapTestimonial(row) });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/home/testimonials" });
  }
}
