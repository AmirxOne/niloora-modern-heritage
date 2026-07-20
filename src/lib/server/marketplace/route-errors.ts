import { badRequest, conflict, forbidden, notFound } from "@/lib/server/http";

export function mapMarketplaceError(error: unknown) {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "VENDOR_NOT_FOUND":
    case "PRODUCT_NOT_FOUND":
      return notFound(error.message);
    case "VENDOR_MEMBERSHIP_REQUIRED":
    case "VENDOR_NOT_ACTIVE":
    case "VENDOR_PRODUCT_FORBIDDEN":
    case "VENDOR_ROLE_FORBIDDEN":
      return forbidden(error.message);
    case "VENDOR_SUBMIT_INVALID_STATE":
    case "PRODUCT_SUBMIT_INVALID_STATE":
    case "PRODUCT_NOT_EDITABLE":
    case "PRODUCT_MODERATION_INVALID_STATE":
    case "VENDOR_APPROVE_INVALID_STATE":
    case "VENDOR_REJECT_INVALID_STATE":
      return badRequest(error.message);
    case "VENDOR_QUOTA_PENDING_LIMIT":
      return conflict("سقف محصولات در انتظار بررسی تکمیل شده است. ابتدا یکی از محصولات pending را مدیریت کنید.");
    case "VENDOR_QUOTA_PRODUCTS_LIMIT":
      return conflict("سقف مجاز محصولات فروشنده تکمیل شده است. برای افزودن محصول جدید، ابتدا ظرفیت را آزاد کنید.");
    default:
      return null;
  }
}
