import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import {
  isCustomizerQuoteStage,
  isCustomizerQuoteStatus,
  updateAdminCustomizerQuote,
} from "@/lib/server/customizer/admin-quote-requests";

type PatchBody = {
  status?: string;
  liveStage?: string;
  etaDays?: number | null;
  workshopLiveMessage?: string | null;
  workshopReply?: string | null;
  quotedTotal?: number | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;
    const body = (await request.json()) as PatchBody;
    const { id } = await context.params;

    if (body.status !== undefined && !isCustomizerQuoteStatus(body.status)) {
      return badRequest("Invalid status");
    }
    if (body.liveStage !== undefined && !isCustomizerQuoteStage(body.liveStage)) {
      return badRequest("Invalid live stage");
    }
    if (
      body.etaDays !== undefined &&
      body.etaDays !== null &&
      (!Number.isFinite(body.etaDays) || body.etaDays < 1 || body.etaDays > 120)
    ) {
      return badRequest("Invalid etaDays");
    }
    if (body.workshopLiveMessage && body.workshopLiveMessage.length > 400) {
      return badRequest("workshopLiveMessage too long");
    }
    if (body.workshopReply && body.workshopReply.length > 500) {
      return badRequest("workshopReply too long");
    }
    if (body.quotedTotal !== undefined && body.quotedTotal !== null && body.quotedTotal < 0) {
      return badRequest("Invalid quotedTotal");
    }

    const quote = await updateAdminCustomizerQuote(id, {
      status: body.status,
      liveStage: body.liveStage,
      etaDays: body.etaDays,
      workshopLiveMessage:
        body.workshopLiveMessage !== undefined ? body.workshopLiveMessage?.trim() || null : undefined,
      workshopReply: body.workshopReply !== undefined ? body.workshopReply?.trim() || null : undefined,
      quotedTotal: body.quotedTotal,
    });

    return ok({ quote });
  } catch (error) {
    return handleRouteError(error, { route: "/api/admin/customizer/quote-requests/[id]" });
  }
}
