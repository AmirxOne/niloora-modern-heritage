import type { Product, ProductComment, ProductQuestion } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import { getVendorTrustScore } from "@/lib/server/marketplace/vendor-trust-service";
import {
  getCatalogProducts,
  getProductByIdFromDb,
  getSameVendorProductsFromDb,
  getSmartRecommendations,
  getRelatedProducts,
  type SmartRecommendationGroups,
} from "@/lib/server/products";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";
import { mapDbProductComment, mapDbProductQuestion } from "@/lib/server/products/product-ugc-mappers";
import { isRingCustomizationEnabled } from "@/lib/server/ring-customization/service";

export type ProductPagePayload = {
  product: Product;
  related: Product[];
  vendorProducts: Product[];
  smartRecommendations: SmartRecommendationGroups;
  activeBundles: import("@/lib/types").BundleOfferDefinition[];
  approvedComments: ProductComment[];
  approvedQuestions: ProductQuestion[];
  ringCustomizationEnabled: boolean;
};

export async function getProductPagePayload(id: string): Promise<ProductPagePayload | null> {
  const baseProduct = await getProductByIdFromDb(id);
  if (!baseProduct) return null;

  const product =
    baseProduct.vendor?.id != null
      ? {
          ...baseProduct,
          vendor: {
            ...baseProduct.vendor,
            trustScore: await getVendorTrustScore(baseProduct.vendor.id),
          },
        }
      : baseProduct;

  const [catalog, approvedCommentRows, approvedQuestionRows, ringCustomizationEnabled] =
    await Promise.all([
      getCatalogProducts(),
      prisma.productComment.findMany({
        where: { productId: id, status: "approved" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.productQuestion.findMany({
        where: { productId: id, status: "approved" },
        include: {
          answers: {
            where: { status: "approved" },
            orderBy: [{ isOfficial: "desc" }, { createdAt: "asc" }],
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      isRingCustomizationEnabled(id),
    ]);

  const approvedComments = approvedCommentRows.map(mapDbProductComment);
  const approvedQuestions = approvedQuestionRows.map(mapDbProductQuestion);
  const related = getRelatedProducts(catalog, product.id, 4);
  const smartRecommendations = getSmartRecommendations(catalog, product.id, 5);
  const vendorProducts =
    product.vendor?.id != null
      ? await getSameVendorProductsFromDb(product.vendor.id, product.id, 8)
      : [];
  const allBundles = await listActiveBundleOffers();
  const activeBundles = allBundles.filter((bundle) => bundle.requiredProductIds.includes(product.id));
  return {
    product,
    related,
    vendorProducts,
    smartRecommendations,
    activeBundles,
    approvedComments,
    approvedQuestions,
    ringCustomizationEnabled,
  };
}

export async function listProductIdsForSitemap(): Promise<
  { id: string; updatedAt: Date }[]
> {
  return prisma.product.findMany({
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
