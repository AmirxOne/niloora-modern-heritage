export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { badRequest, created, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import { validateVendorProductInput } from "@/lib/vendor/vendor-product-validation";
import {
  createVendorProduct,
  listVendorProducts,
  type VendorProductInput,
} from "@/lib/server/marketplace/vendor-product-service";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";
import {
  createCriticalFlowContext,
  logCriticalOutcome,
  logCriticalStart,
  withCorrelationId,
} from "@/lib/observability/critical-flow";

export async function GET(request: Request) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/vendor/products",
    role: "vendor",
    journey: "vendor_products",
    action: "vendor_products_list",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    if (!user) {
      logCriticalOutcome(critical, "blocked", { code: "unauthorized" });
      return withCorrelationId(unauthorized(), critical.correlationId);
    }

    const products = await listVendorProducts(user.id);
    logCriticalOutcome(critical, "success", { userId: user.id, productCount: products.length });
    return withCorrelationId(ok({ products }), critical.correlationId);
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    const mapped = mapMarketplaceError(error);
    if (mapped) return withCorrelationId(mapped, critical.correlationId);
    return handleRouteError(error, {
      route: "/api/vendor/products",
      request,
      role: "vendor",
      journey: "vendor_products",
      action: "vendor_products_list",
    });
  }
}

export async function POST(request: Request) {
  const critical = createCriticalFlowContext(request, {
    route: "/api/vendor/products",
    role: "vendor",
    journey: "vendor_products",
    action: "vendor_product_create",
  });
  logCriticalStart(critical);
  try {
    const user = await readSessionUser();
    if (!user) {
      logCriticalOutcome(critical, "blocked", { code: "unauthorized" });
      return withCorrelationId(unauthorized(), critical.correlationId);
    }
    await requireActiveVendorOwner(user.id);

    const body = (await request.json()) as Partial<VendorProductInput>;
    const parsed = validateVendorProductInput(body, "create");
    if (!parsed.ok) {
      logCriticalOutcome(critical, "blocked", { code: "vendor_product_invalid_payload", userId: user.id });
      return withCorrelationId(badRequest(parsed.message), critical.correlationId);
    }

    const product = await createVendorProduct(user.id, {
      name: parsed.data.name!,
      namePersian: parsed.data.namePersian!,
      price: Number(parsed.data.price),
      image: parsed.data.image!,
      category: parsed.data.category,
      metal: parsed.data.metal,
      stone: parsed.data.stone,
      stoneShape: body.stoneShape,
      engravingType: body.engravingType,
      availability: parsed.data.availability,
      stock: parsed.data.stock,
      listingHeadline: parsed.data.listingHeadline,
    });

    logCriticalOutcome(critical, "success", { userId: user.id, productId: product.id });
    return withCorrelationId(created({ product }), critical.correlationId);
  } catch (error) {
    logCriticalOutcome(critical, "failed");
    const mapped = mapMarketplaceError(error);
    if (mapped) return withCorrelationId(mapped, critical.correlationId);
    return handleRouteError(error, {
      route: "/api/vendor/products",
      request,
      role: "vendor",
      journey: "vendor_products",
      action: "vendor_product_create",
    });
  }
}
