import type { BundleOfferUpsertInput } from "@/lib/server/bundle/bundle-offer-service";

type ParseResult = { ok: true; data: BundleOfferUpsertInput } | { ok: false; message: string };

function parseIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((id) => String(id).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[,،\n]/)
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseAdminBundleBody(body: unknown): ParseResult {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "بدنهٔ درخواست نامعتبر است." };
  }
  const b = body as Record<string, unknown>;
  const title = String(b.title ?? "").trim();
  const description = String(b.description ?? "").trim();
  const discountType = String(b.discountType ?? "").trim();
  const discountValue = Number(b.discountValue);
  const requiredProductIds = parseIds(b.requiredProductIds);
  const active = b.active !== false;

  if (title.length < 2) return { ok: false, message: "عنوان باندل الزامی است." };
  if (discountType !== "percent" && discountType !== "fixed") {
    return { ok: false, message: "نوع تخفیف باندل نامعتبر است." };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, message: "مقدار تخفیف باندل باید عدد مثبت باشد." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { ok: false, message: "تخفیف درصدی باندل نمی‌تواند بیشتر از ۱۰۰ باشد." };
  }
  if (requiredProductIds.length < 2) {
    return { ok: false, message: "هر باندل باید حداقل ۲ محصول داشته باشد." };
  }

  return {
    ok: true,
    data: {
      title,
      description: description || null,
      discountType: discountType as "percent" | "fixed",
      discountValue: Math.round(discountValue),
      requiredProductIds: Array.from(new Set(requiredProductIds)),
      active,
    },
  };
}
