import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { verifyPieceCodePublic } from "@/lib/server/authenticity/verify";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pieceCode = searchParams.get("pieceCode")?.trim() ?? "";
    if (!pieceCode) return badRequest("Missing pieceCode");
    const result = await verifyPieceCodePublic(pieceCode, request);
    return ok(result);
  } catch (error) {
    return handleRouteError(error, { route: "/api/authenticity/verify" });
  }
}
