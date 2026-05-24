import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { isAdminMediaCategory } from "@/lib/media/categories";
import { listMediaAssets, storeMediaAsset } from "@/lib/server/media/store";
import { writeAdminAuditLog } from "@/lib/server/audit-log";

export async function GET(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category")?.trim() || undefined;
    if (category && !isAdminMediaCategory(category)) {
      return badRequest("دسته‌بندی رسانه نامعتبر است.");
    }
    const assets = await listMediaAssets(category);
    return ok({ assets });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/media" });
  }
}

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const formData = await request.formData();
    const categoryRaw = String(formData.get("category") ?? "general").trim();
    if (!isAdminMediaCategory(categoryRaw)) {
      return badRequest("دسته‌بندی رسانه نامعتبر است.");
    }
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return badRequest("فایل ارسال نشده است.");
    }
    if (file.size <= 0) {
      return badRequest("فایل خالی است.");
    }
    if (file.size > 10 * 1024 * 1024) {
      return badRequest("حداکثر حجم فایل ۱۰ مگابایت است.");
    }

    const asset = await storeMediaAsset({ file, category: categoryRaw });
    await writeAdminAuditLog({
      user: { id: user?.id ?? "unknown-admin", name: user?.name, phone: user?.phone, role: user?.role },
      request,
      action: "admin.media.upload",
      route: "/api/admin/media",
      entityType: "media",
      entityId: asset.id,
      summary: `upload media ${asset.id}`,
      payload: {
        id: asset.id,
        category: asset.category,
        url: asset.url,
        webpUrl: asset.webpUrl,
        sizeBytes: asset.sizeBytes,
      },
    });
    return ok({ asset });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/media" });
  }
}
