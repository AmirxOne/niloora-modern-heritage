import { badRequest, ok, serverError } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { readSessionUser } from "@/lib/server/auth/session";
import { ensureAdmin } from "@/lib/server/auth/guards";
import { runTelegramFullSync, runTelegramIncrementalSync } from "@/lib/server/telegram/sync";

type Body = {
  mode?: "full" | "incremental";
  channel?: string;
};

export async function POST(request: Request) {
  try {
    const user = await readSessionUser();
    const denied = ensureAdmin(user);
    if (denied) return denied;

    const body = (await request.json()) as Body;
    const mode = body.mode ?? "incremental";
    const channel = body.channel ?? process.env.TELEGRAM_CHANNEL ?? "galleryhannan";
    if (mode !== "full" && mode !== "incremental") {
      return badRequest("mode must be full or incremental");
    }

    const report =
      mode === "full" ? await runTelegramFullSync(channel) : await runTelegramIncrementalSync(channel);
    return ok({ report });
  } catch (error) {
    return handleRouteError(error, { route: "/api/telegram/sync" });
  }
}

