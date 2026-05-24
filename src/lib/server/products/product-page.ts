import type { Product } from "@/lib/types";
import { prisma } from "@/lib/server/prisma";
import {
  getCatalogProducts,
  getProductByIdFromDb,
  getSmartRecommendations,
  getRelatedProducts,
  type SmartRecommendationGroups,
} from "@/lib/server/products";
import { listActiveBundleOffers } from "@/lib/server/bundle/bundle-offer-service";
export type ProductPagePayload = {
  product: Product;
  related: Product[];
  smartRecommendations: SmartRecommendationGroups;
  activeBundles: import("@/lib/types").BundleOfferDefinition[];
  approvedComments: Array<{
    id: string;
    authorName: string;
    body: string;
    rating: number;
    createdAt: Date;
  }>;
  approvedQuestions: Array<{
    id: string;
    body: string;
    answers: Array<{
      id: string;
      body: string;
      isOfficial: boolean;
      createdAt: Date;
    }>;
  }>;
};

export async function getProductPagePayload(id: string): Promise<ProductPagePayload | null> {
  const product = await getProductByIdFromDb(id);
  if (!product) return null;

  const [catalog, approvedComments, approvedQuestions] = await Promise.all([
    getCatalogProducts(),
    prisma.productComment.findMany({
      where: { productId: id, status: "approved" },
      select: { id: true, authorName: true, body: true, rating: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.productQuestion.findMany({
      where: { productId: id, status: "approved" },
      select: {
        id: true,
        body: true,
        answers: {
          where: { status: "approved" },
          select: { id: true, body: true, isOfficial: true, createdAt: true },
          orderBy: [{ isOfficial: "desc" }, { createdAt: "asc" }],
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  const related = getRelatedProducts(catalog, product.id, 4);
  const smartRecommendations = getSmartRecommendations(catalog, product.id, 5);
  const allBundles = await listActiveBundleOffers();
  const activeBundles = allBundles.filter((bundle) => bundle.requiredProductIds.includes(product.id));
  return {
    product,
    related,
    smartRecommendations,
    activeBundles,
    approvedComments,
    approvedQuestions,
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
