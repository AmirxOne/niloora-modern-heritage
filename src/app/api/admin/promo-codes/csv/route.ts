import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { ok, badRequest } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { excelResponse, parseExcelBuffer, serializeExcelBuffer } from "@/lib/server/excel";
import { listAdminPromoCodes, createPromoCode, updatePromoCode } from "@/lib/server/promo/promo-code-service";
import { parseAdminPromoBody } from "@/lib/server/promo/admin-promo-parse";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const promoCodes = await listAdminPromoCodes();
    const rows = promoCodes.map((item) => ({
      id: item.id,
      code: item.code,
      label: item.label,
      type: item.type,
      value: item.value,
      minSubtotal: item.minSubtotal,
      replacesSiteWide: item.replacesSiteWide ? "1" : "0",
      active: item.active ? "1" : "0",
      aliases: item.aliases.join("|"),
    }));
    return excelResponse(
      "promo-codes.xlsx",
      serializeExcelBuffer(
        ["id", "code", "label", "type", "value", "minSubtotal", "replacesSiteWide", "active", "aliases"],
        rows
      )
    );
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/promo-codes/csv" });
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

    const errors: Array<{ row: number; code?: string; message: string }> = [];
    let created = 0;
    let updated = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowNo = i + 2;
      const parseResult = parseAdminPromoBody({
        code: row.code,
        label: row.label,
        type: row.type,
        value: row.value,
        minSubtotal: row.minSubtotal,
        replacesSiteWide: row.replacesSiteWide === "1" || row.replacesSiteWide?.toLowerCase() === "true",
        active: row.active === "1" || row.active?.toLowerCase() === "true",
        aliases: row.aliases ? row.aliases.split("|").map((item) => item.trim()).filter(Boolean) : [],
      });
      if (!parseResult.ok) {
        errors.push({ row: rowNo, code: row.code, message: parseResult.message });
        continue;
      }

      try {
        const existing = await prisma.promoCode.findFirst({
          where: { code: parseResult.data.code.trim().toUpperCase() },
          select: { id: true },
        });
        if (existing) {
          await updatePromoCode(existing.id, parseResult.data);
          updated += 1;
        } else {
          await createPromoCode(parseResult.data);
          created += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "خطای نامشخص";
        errors.push({ row: rowNo, code: row.code, message });
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
    return handleRouteError(error, { route: "/api/admin/promo-codes/csv" });
  }
}
