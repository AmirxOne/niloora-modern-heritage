export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, badRequest } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { excelResponse, parseExcelBuffer, serializeExcelBuffer } from "@/lib/server/excel";
import { listAdminProducts, createAdminProduct, updateAdminProduct, getAdminProductById } from "@/lib/server/products/admin-product-service";
import { parseAdminProductBody } from "@/lib/server/products/admin-product";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const products = await listAdminProducts();
    const headers = [
      "id",
      "name",
      "namePersian",
      "price",
      "listPrice",
      "discountPercent",
      "availability",
      "stock",
      "collectionId",
      "featured",
      "bestseller",
      "introVideoUrl",
      "image",
      "images",
      "category",
      "metal",
      "stone",
      "stoneShape",
      "engravingType",
      "listingTier",
      "listingHeadline",
    ];
    const rows = products.map((p) => ({
      id: p.id,
      name: p.name,
      namePersian: p.namePersian,
      price: p.price,
      listPrice: p.listPrice ?? "",
      discountPercent: p.discountPercent ?? "",
      availability: p.availability,
      stock: p.stock,
      collectionId: p.collectionId ?? "",
      featured: p.featured ? "1" : "0",
      bestseller: p.bestseller ? "1" : "0",
      introVideoUrl: p.introVideoUrl ?? "",
      image: p.image,
      images: (p.images ?? []).join("|"),
      category: p.category,
      metal: p.metal,
      stone: p.stone,
      stoneShape: p.stoneShape,
      engravingType: p.engravingType,
      listingTier: p.listing?.tier ?? "premium",
      listingHeadline: p.listing?.headline ?? p.namePersian,
    }));
    return excelResponse("products.xlsx", serializeExcelBuffer(headers, rows));
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/csv" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const buffer = await request.arrayBuffer();
    const { rows } = parseExcelBuffer(buffer);
    if (rows.length === 0) return badRequest("فایل Excel خالی است.");

    const errors: Array<{ row: number; id?: string; message: string }> = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const id = row.id?.trim();
      const payloadRaw = {
        id,
        name: row.name,
        namePersian: row.namePersian,
        price: row.price,
        listPrice: row.listPrice || null,
        discountPercent: row.discountPercent || null,
        availability: row.availability,
        stock: row.stock,
        collectionId: row.collectionId || null,
        featured: row.featured === "1" || row.featured?.toLowerCase() === "true",
        bestseller: row.bestseller === "1" || row.bestseller?.toLowerCase() === "true",
        introVideoUrl: row.introVideoUrl || null,
        image: row.image,
        images: row.images ? row.images.split("|").map((item) => item.trim()).filter(Boolean) : [],
        category: row.category,
        metal: row.metal,
        stone: row.stone,
        stoneShape: row.stoneShape,
        engravingType: row.engravingType,
        listingTier: row.listingTier || "premium",
        listingHeadline: row.listingHeadline || row.namePersian,
      };
      const parsed = parseAdminProductBody(payloadRaw, { requireId: true });
      if (!parsed.ok) {
        errors.push({ row: rowNo, id, message: parsed.message });
        continue;
      }

      try {
        const existing = await getAdminProductById(parsed.data.id);
        if (existing) {
          await updateAdminProduct(parsed.data.id, parsed.data);
          updated += 1;
        } else {
          await createAdminProduct(parsed.data);
          created += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "خطای نامشخص";
        errors.push({ row: rowNo, id, message });
      }
    }

    return ok({
      totalRows: rows.length,
      created,
      updated,
      failed: errors.length,
      errors,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/products/csv" });
  }
}
