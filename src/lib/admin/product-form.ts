import { DEFAULT_PRODUCT_IMAGE } from "@/lib/images";
import type { AdminProductDto } from "@/lib/server/products/admin-product-dto";
import type {
  EngravingStyle,
  MetalType,
  ProductAvailability,
  RingStyle,
  StoneShape,
  StoneType,
} from "@/lib/types";

export type AdminProductFormValues = {
  id: string;
  name: string;
  namePersian: string;
  price: string;
  listPrice: string;
  discountPercent: string;
  image: string;
  galleryText: string;
  availability: ProductAvailability;
  stock: string;
  collectionId: string;
  category: RingStyle;
  metal: MetalType;
  stone: StoneType;
  stoneShape: StoneShape;
  engravingType: EngravingStyle | "none";
  featured: boolean;
  bestseller: boolean;
  listingHeadline: string;
  listingTier: "premium" | "economy";
};

export function emptyAdminProductForm(): AdminProductFormValues {
  return {
    id: "",
    name: "",
    namePersian: "",
    price: "",
    listPrice: "",
    discountPercent: "",
    image: DEFAULT_PRODUCT_IMAGE,
    galleryText: "",
    availability: "ready",
    stock: "1",
    collectionId: "",
    category: "solitaire",
    metal: "sterling",
    stone: "turquoise",
    stoneShape: "round",
    engravingType: "none",
    featured: false,
    bestseller: false,
    listingHeadline: "",
    listingTier: "premium",
  };
}

export function adminProductToForm(product: AdminProductDto): AdminProductFormValues {
  const gallery = (product.images ?? []).filter((url) => url !== product.image);
  return {
    id: product.id,
    name: product.name,
    namePersian: product.namePersian,
    price: String(product.price),
    listPrice: product.listPrice != null ? String(product.listPrice) : "",
    discountPercent:
      product.discountPercent != null ? String(product.discountPercent) : "",
    image: product.image,
    galleryText: gallery.join("\n"),
    availability: product.availability,
    stock: String(product.stock),
    collectionId: product.collectionId ?? "",
    category: product.category,
    metal: product.metal,
    stone: product.stone,
    stoneShape: product.stoneShape,
    engravingType: product.engravingType,
    featured: product.featured,
    bestseller: product.bestseller,
    listingHeadline: product.listing.headline,
    listingTier: product.listing.tier,
  };
}

export function adminProductFormToPayload(values: AdminProductFormValues) {
  return {
    id: values.id,
    name: values.name,
    namePersian: values.namePersian,
    price: values.price,
    listPrice: values.listPrice || null,
    discountPercent: values.discountPercent || null,
    image: values.image,
    images: values.galleryText,
    availability: values.availability,
    stock: values.stock,
    collectionId: values.collectionId || null,
    category: values.category,
    metal: values.metal,
    stone: values.stone,
    stoneShape: values.stoneShape,
    engravingType: values.engravingType,
    featured: values.featured,
    bestseller: values.bestseller,
    listingHeadline: values.listingHeadline,
    listingTier: values.listingTier,
  };
}
