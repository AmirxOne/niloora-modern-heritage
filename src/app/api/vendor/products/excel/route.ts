export { dynamic } from "@/lib/server/route-segment";

import { readSessionUser } from "@/lib/server/auth/session";
import { writeAdminAuditLog } from "@/lib/server/audit-log";
import { excelResponse, parseExcelBuffer, serializeExcelBuffer } from "@/lib/server/excel";
import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { mapMarketplaceError } from "@/lib/server/marketplace/route-errors";
import {
  createVendorProduct,
  type VendorProductInput,
} from "@/lib/server/marketplace/vendor-product-service";
import { handleRouteError } from "@/lib/server/route-errors";
import { requireActiveVendorOwner } from "@/lib/server/vendor/vendor-guards";
import { validateVendorProductInput } from "@/lib/vendor/vendor-product-validation";

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

type BulkRowError = {
  row: number;
  message: string;
};

function toBulkPayload(row: Record<string, string>): Partial<Record<keyof VendorProductInput, unknown>> {
  return {
    name: row.name,
    namePersian: row.namePersian,
    image: row.image,
    price: row.price,
    stock: row.stock,
    category: row.category,
    metal: row.metal,
    stone: row.stone,
    listingHeadline: row.listingHeadline,
  };
}

function toBulkErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "خطای نامشخص";
  switch (error.message) {
    case "VENDOR_QUOTA_PRODUCTS_LIMIT":
      return "سقف مجاز محصولات فروشنده تکمیل شده است.";
    case "VENDOR_NOT_ACTIVE":
      return "حساب فروشنده هنوز فعال نیست.";
    case "VENDOR_PRODUCT_FORBIDDEN":
    case "VENDOR_ROLE_FORBIDDEN":
      return "دسترسی لازم برای این عملیات را ندارید.";
    default:
      return error.message;
  }
}

function excelTemplateHeaders(): string[] {
  return [
    "name",
    "namePersian",
    "price",
    "stock",
    "category",
    "metal",
    "stone",
    "listingHeadline",
    "image",
  ];
}

function excelSampleRows(): Array<Record<string, string>> {
  return [
    {
      name: "Heritage Ring",
      namePersian: "انگشتر میراث",
      price: "1250000",
      stock: "3",
      category: "signet",
      metal: "sterling",
      stone: "turquoise",
      listingHeadline: "انگشتر میراث با نگین فیروزه",
      image: "/uploads/vendor-media/<vendor-id>/sample-1.webp",
    },
    {
      name: "Royal Signet",
      namePersian: "انگشتر سلطنتی",
      price: "1890000",
      stock: "2",
      category: "signet",
      metal: "rhodium",
      stone: "onyx",
      listingHeadline: "انگشتر سلطنتی با نگین اونیکس",
      image: "/uploads/vendor-media/<vendor-id>/sample-2.webp",
    },
  ];
}

function excelTemplateRow(): Record<string, string> {
  return {
    name: "",
    namePersian: "",
    price: "",
    stock: "",
    category: "",
    metal: "",
    stone: "",
    listingHeadline: "",
    image: "",
  };
}

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    await requireActiveVendorOwner(user.id);

    const url = new URL(request.url);
    const kind = url.searchParams.get("kind");
    if (kind === "sample") {
      const sampleBuffer = serializeExcelBuffer(excelTemplateHeaders(), excelSampleRows());
      return excelResponse("vendor-products-sample.xlsx", sampleBuffer);
    }

    const templateBuffer = serializeExcelBuffer(excelTemplateHeaders(), [excelTemplateRow()]);
    return excelResponse("vendor-products-template.xlsx", templateBuffer);
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/products/excel", request });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    if (!user) return unauthorized();
    await requireActiveVendorOwner(user.id);

    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes(EXCEL_MIME)) {
      return badRequest("فرمت فایل نامعتبر است. فایل باید Excel باشد.");
    }

    const buffer = await request.arrayBuffer();
    const { rows } = parseExcelBuffer(buffer);
    if (rows.length === 0) return badRequest("فایل Excel خالی است.");

    const errors: BulkRowError[] = [];
    const createdProductIds: string[] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const rowNo = i + 2;
      const parsed = validateVendorProductInput(
        toBulkPayload(rows[i]) as Partial<VendorProductInput>,
        "create"
      );
      if (!parsed.ok) {
        errors.push({ row: rowNo, message: parsed.message });
        continue;
      }
      try {
        const product = await createVendorProduct(user.id, {
          name: parsed.data.name!,
          namePersian: parsed.data.namePersian!,
          price: Number(parsed.data.price),
          image: parsed.data.image!,
          stock: parsed.data.stock,
          category: parsed.data.category,
          metal: parsed.data.metal,
          stone: parsed.data.stone,
          availability: parsed.data.availability,
          listingHeadline: parsed.data.listingHeadline,
        });
        createdProductIds.push(product.id);
      } catch (error) {
        errors.push({ row: rowNo, message: toBulkErrorMessage(error) });
      }
    }

    await writeAdminAuditLog({
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
      request,
      action: "vendor.products.bulk_upload_excel",
      route: "/api/vendor/products/excel",
      entityType: "product",
      summary: `vendor bulk upload created=${createdProductIds.length} failed=${errors.length}`,
      payload: {
        totalRows: rows.length,
        created: createdProductIds.length,
        failed: errors.length,
        createdProductIds,
        errors: errors.slice(0, 50),
      },
    });

    return ok({
      totalRows: rows.length,
      created: createdProductIds.length,
      failed: errors.length,
      createdProductIds,
      errors,
    });
  } catch (error) {
    const mapped = mapMarketplaceError(error);
    if (mapped) return mapped;
    return handleRouteError(error, { route: "/api/vendor/products/excel", request });
  }
}
