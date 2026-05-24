import { badRequest, ok, unauthorized } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { serverEnv } from "@/lib/server/env";
import {
  runBirthdayJourneys,
  runOrderFollowupJourneys,
  runWinbackJourneys,
} from "@/lib/server/notifications/journey-notify";
import { runPriceDropAlerts } from "@/lib/server/notifications/price-drop-notify";
import { runMaintenanceReminderJourneys } from "@/lib/server/notifications/maintenance-reminders";

export async function POST(request: Request) {
  try {
    const provided = request.headers.get("x-cron-secret")?.trim() ?? "";
    if (!serverEnv.abandonedCartCronSecret || provided !== serverEnv.abandonedCartCronSecret) {
      return unauthorized("forbidden");
    }

    if (!serverEnv.notifyEnabled) {
      return badRequest("notifications_disabled");
    }

    const [birthday, winback, orderFollowup, maintenance, priceDrop] = await Promise.all([
      runBirthdayJourneys(),
      runWinbackJourneys(),
      runOrderFollowupJourneys(),
      runMaintenanceReminderJourneys(),
      runPriceDropAlerts(),
    ]);

    return ok({
      birthday,
      winback,
      orderFollowup,
      maintenance,
      priceDrop,
    });
  } catch (error) {
    return handleRouteError(error, { route: "/api/cron/messaging-journeys" });
  }
}
