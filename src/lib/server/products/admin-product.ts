import { PRODUCT_AVAILABILITY_OPTIONS } from "@/lib/product-status";
import type {
  EngravingStyle,
  MetalType,
  ProductAvailability,
  RingStyle,
  StoneShape,
  StoneType,
} from "@/lib/types";
import { parseDiscountEndsAtInput } from "@/lib/server/discounts/countdown";

const RING_STYLES: RingStyle[] = [
  "solitaire",
  "halo",
  "vintage",
  "signet",
  "eternity",
  "stackable",
];

const METALS: MetalType[] = ["sterling", "oxidized", "rhodium", "matte-silver"];

const STONES: StoneType[] = [
  "diamond",
  "emerald",
  "sapphire",
  "ruby",
  "turquoise",
  "onyx",
  "zabarjad",
  "yemen-aqeeq",
  "durr-najaf",
  "moral",
];

const SHAPES: StoneShape[] = ["round", "oval", "cushion", "princess", "pear", "marquise"];

const ENGRAVINGS: (EngravingStyle | "none")[] = [
  "none",
  "nastaliq",
  "naskh",
  "thuluth",
  "kufic",
  "modern",
];

export type AdminProductPayload = {
  id: string;
  name: string;
  namePersian: string;
  introVideoUrl: string | null;
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
  image: string;
  images: string[];
  availability: ProductAvailability;
  stock: number;
  collectionId: string | null;
  category: RingStyle;
  metal: MetalType;
  stone: StoneType;
  stoneShape: StoneShape;
  engravingType: EngravingStyle | "none";
  featured: boolean;
  bestseller: boolean;
  listingHeadline: string;
  listingTier: "premium" | "economy";
  discountEndsAt?: string | null;
};

export type AdminProductBulkPayload = {
  ids: string[];
  price?: number;
  stock?: number;
  availability?: ProductAvailability;
  discountPercent?: number | null;
};

function slugifyId(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePositiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

function parseOptionalPercent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 95) return null;
  return Math.round(n);
}

function parseOptionalVideoUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\/\S+$/i.test(raw) || /^\/\S+/.test(raw)) {
    return raw;
  }
  return undefined;
}

export function resolveProductPricing(input: {
  price: number;
  listPrice: number | null;
  discountPercent: number | null;
}): { price: number; listPrice: number | null; discountPercent: number | null } {
  const price = input.price;
  let listPrice = input.listPrice;
  let discountPercent = input.discountPercent;

  if (discountPercent != null && discountPercent > 0) {
    if (listPrice == null || listPrice < price) {
      listPrice = Math.round(price / (1 - discountPercent / 100));
    }
  } else if (listPrice != null && listPrice > price) {
    discountPercent = Math.round(((listPrice - price) / listPrice) * 100);
  } else {
    listPrice = null;
    discountPercent = null;
  }

  if (listPrice != null && listPrice < price) {
    listPrice = price;
    discountPercent = null;
  }

  return { price, listPrice, discountPercent };
}

export function parseAdminProductBody(
  raw: unknown,
  options?: { requireId?: boolean; existingId?: string }
): { ok: true; data: AdminProductPayload } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "دادهٔ محصول نامعتبر است." };
  }

  const body = raw as Record<string, unknown>;
  const id = options?.existingId ?? slugifyId(String(body.id ?? ""));
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    return { ok: false, message: "شناسه محصول باید انگلیسی و با خط تیره باشد (مثال: shiraz-solitaire)." };
  }
  if (options?.requireId && !body.id) {
    return { ok: false, message: "شناسه محصول الزامی است." };
  }

  const name = String(body.name ?? "").trim();
  const namePersian = String(body.namePersian ?? "").trim();
  if (name.length < 2 || namePersian.length < 2) {
    return { ok: false, message: "نام انگلیسی و فارسی محصول را وارد کنید." };
  }

  const price = parsePositiveInt(body.price);
  if (price == null || price <= 0) {
    return { ok: false, message: "قیمت فروش باید عدد مثبت باشد." };
  }

  const listPriceRaw = body.listPrice;
  const listPrice =
    listPriceRaw === null || listPriceRaw === undefined || listPriceRaw === ""
      ? null
      : parsePositiveInt(listPriceRaw);
  if (listPriceRaw != null && listPriceRaw !== "" && (listPrice == null || listPrice <= 0)) {
    return { ok: false, message: "قیمت قبل از تخفیف نامعتبر است." };
  }

  const discountPercent = parseOptionalPercent(body.discountPercent);
  if (
    body.discountPercent != null &&
    body.discountPercent !== "" &&
    discountPercent == null
  ) {
    return { ok: false, message: "درصد تخفیف باید بین ۰ تا ۹۵ باشد." };
  }

  const pricing = resolveProductPricing({ price, listPrice, discountPercent });

  const introVideoParsed = parseOptionalVideoUrl(body.introVideoUrl);
  if (body.introVideoUrl !== undefined && introVideoParsed === undefined) {
    return { ok: false, message: "آدرس ویدیو نامعتبر است." };
  }

  const image = String(body.image ?? "").trim();
  if (!image.startsWith("/") && !image.startsWith("http")) {
    return { ok: false, message: "آدرس تصویر اصلی نامعتبر است." };
  }

  const imagesRaw = body.images;
  const images: string[] = Array.isArray(imagesRaw)
    ? imagesRaw.map((u) => String(u).trim()).filter(Boolean)
    : String(imagesRaw ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

  const uniqueImages = Array.from(new Set(images.filter((u) => u !== image)));

  const availability = String(body.availability ?? "");
  if (!PRODUCT_AVAILABILITY_OPTIONS.includes(availability as ProductAvailability)) {
    return { ok: false, message: "وضعیت موجودی نامعتبر است." };
  }

  const stockRaw = body.stock;
  const stock =
    stockRaw === null || stockRaw === undefined || stockRaw === ""
      ? availability === "sold"
        ? 0
        : 1
      : parsePositiveInt(stockRaw);
  if (stock == null || stock < 0) {
    return { ok: false, message: "تعداد موجودی باید عدد صحیح و بزرگ‌تر یا مساوی صفر باشد." };
  }
  if (availability === "sold" && stock > 0) {
    return { ok: false, message: "برای وضعیت «فروخته‌شده» موجودی باید صفر باشد." };
  }

  const category = String(body.category ?? "");
  if (!RING_STYLES.includes(category as RingStyle)) {
    return { ok: false, message: "دستهٔ محصول نامعتبر است." };
  }

  const metal = String(body.metal ?? "");
  if (!METALS.includes(metal as MetalType)) {
    return { ok: false, message: "جنس فلز نامعتبر است." };
  }

  const stone = String(body.stone ?? "");
  if (!STONES.includes(stone as StoneType)) {
    return { ok: false, message: "نوع سنگ نامعتبر است." };
  }

  const stoneShape = String(body.stoneShape ?? "");
  if (!SHAPES.includes(stoneShape as StoneShape)) {
    return { ok: false, message: "برش سنگ نامعتبر است." };
  }

  const engravingType = String(body.engravingType ?? "none");
  if (!ENGRAVINGS.includes(engravingType as EngravingStyle | "none")) {
    return { ok: false, message: "نوع حکاکی نامعتبر است." };
  }

  const collectionIdRaw = body.collectionId;
  const collectionId =
    collectionIdRaw === null || collectionIdRaw === undefined || collectionIdRaw === ""
      ? null
      : String(collectionIdRaw).trim();

  const listingTier = body.listingTier === "economy" ? "economy" : "premium";
  const listingHeadline = String(body.listingHeadline ?? namePersian).trim() || namePersian;

  const discountEndsAtParsed = parseDiscountEndsAtInput(body.discountEndsAt);
  if (body.discountEndsAt != null && body.discountEndsAt !== "" && discountEndsAtParsed === null) {
    return { ok: false, message: "تاریخ پایان تخفیف محصول نامعتبر است." };
  }

  return {
    ok: true,
    data: {
      id,
      name,
      namePersian,
      introVideoUrl: introVideoParsed ?? null,
      price: pricing.price,
      listPrice: pricing.listPrice,
      discountPercent: pricing.discountPercent,
      image,
      images: uniqueImages,
      availability: availability as ProductAvailability,
      stock,
      collectionId,
      category: category as RingStyle,
      metal: metal as MetalType,
      stone: stone as StoneType,
      stoneShape: stoneShape as StoneShape,
      engravingType: engravingType as EngravingStyle | "none",
      featured: Boolean(body.featured),
      bestseller: Boolean(body.bestseller),
      listingHeadline,
      listingTier,
      ...(discountEndsAtParsed !== undefined
        ? { discountEndsAt: discountEndsAtParsed?.toISOString() ?? null }
        : {}),
    },
  };
}

export function parseAdminProductBulkBody(
  raw: unknown
): { ok: true; data: AdminProductBulkPayload } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "دادهٔ ویرایش گروهی نامعتبر است." };
  }

  const body = raw as Record<string, unknown>;
  const idsRaw = Array.isArray(body.ids) ? body.ids : [];
  const ids = Array.from(
    new Set(
      idsRaw
        .map((value) => String(value ?? "").trim())
        .filter((value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    )
  );
  if (ids.length === 0) {
    return { ok: false, message: "حداقل یک محصول برای ویرایش گروهی انتخاب کنید." };
  }

  const parsed: AdminProductBulkPayload = { ids };

  if (body.price !== undefined && body.price !== "") {
    const price = parsePositiveInt(body.price);
    if (price == null || price <= 0) {
      return { ok: false, message: "قیمت فروش باید عدد مثبت باشد." };
    }
    parsed.price = price;
  }

  if (body.stock !== undefined && body.stock !== "") {
    const stock = parsePositiveInt(body.stock);
    if (stock == null || stock < 0) {
      return { ok: false, message: "تعداد موجودی باید عدد صحیح و بزرگ‌تر یا مساوی صفر باشد." };
    }
    parsed.stock = stock;
  }

  if (body.availability !== undefined && body.availability !== "") {
    const availability = String(body.availability);
    if (!PRODUCT_AVAILABILITY_OPTIONS.includes(availability as ProductAvailability)) {
      return { ok: false, message: "وضعیت موجودی نامعتبر است." };
    }
    parsed.availability = availability as ProductAvailability;
  }

  if (body.discountPercent !== undefined) {
    if (body.discountPercent === "" || body.discountPercent === null) {
      parsed.discountPercent = null;
    } else {
      const discountPercent = parseOptionalPercent(body.discountPercent);
      if (discountPercent == null) {
        return { ok: false, message: "درصد تخفیف باید بین ۰ تا ۹۵ باشد." };
      }
      parsed.discountPercent = discountPercent;
    }
  }

  if (
    parsed.price === undefined &&
    parsed.stock === undefined &&
    parsed.availability === undefined &&
    parsed.discountPercent === undefined
  ) {
    return { ok: false, message: "حداقل یک فیلد برای ویرایش گروهی انتخاب کنید." };
  }

  const finalAvailability = parsed.availability;
  const finalStock = parsed.stock;
  if (finalAvailability === "sold" && finalStock !== undefined && finalStock > 0) {
    return { ok: false, message: "برای وضعیت «فروخته‌شده» موجودی باید صفر باشد." };
  }

  return { ok: true, data: parsed };
}
