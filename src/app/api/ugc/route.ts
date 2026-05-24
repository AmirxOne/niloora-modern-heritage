import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { prisma } from "@/lib/server/prisma";
import { createProductUgc, listApprovedProductUgc } from "@/lib/server/ugc/ugc-media";

type PostBody = {
  productId?: string;
  orderId?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  caption?: string;
};

function normalizeMediaType(value: string | undefined): "image" | "video" | null {
  if (value === "image" || value === "video") return value;
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim() ?? "";
    if (!productId) return badRequest("Missing productId");
    const items = await listApprovedProductUgc(productId);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error, { route: "/api/ugc" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json()) as PostBody;
    const productId = body.productId?.trim() ?? "";
    const mediaUrl = body.mediaUrl?.trim() ?? "";
    const caption = body.caption?.trim() ?? "";
    const mediaType = normalizeMediaType(body.mediaType);
    const orderId = body.orderId?.trim();

    if (!productId || !mediaUrl || !mediaType) return badRequest("Invalid payload");
    if (!/^https?:\/\//i.test(mediaUrl)) return badRequest("Invalid mediaUrl");
    if (caption.length > 280) return badRequest("Caption too long");

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
        select: {
          id: true,
          items: { select: { productId: true } },
        },
      });
      if (!order) return badRequest("Invalid orderId");
      const hasProduct = order.items.some((item) => item.productId === productId);
      if (!hasProduct) return badRequest("Order does not contain product");
    }

    const item = await createProductUgc({
      productId,
      userId: user.id,
      orderId: orderId || undefined,
      mediaUrl,
      mediaType,
      caption: caption || undefined,
    });
    return created({ item });
  } catch (error) {
    return handleRouteError(error, { route: "/api/ugc" });
  }
}
