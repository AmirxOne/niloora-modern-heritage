export { dynamic } from "@/lib/server/route-segment";

import { badRequest, ok } from "@/lib/server/http";
import { handleRouteError } from "@/lib/server/route-errors";
import { getExperimentDefinition } from "@/lib/ab/experiments";
import { writeAbLog } from "@/lib/server/ab/log-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const experimentId = typeof body.experimentId === "string" ? body.experimentId.trim() : "";
    const variantId = typeof body.variantId === "string" ? body.variantId.trim() : "";
    const identity = typeof body.identity === "string" ? body.identity.trim() : "";
    const page = typeof body.page === "string" ? body.page.trim() : undefined;
    const type =
      body.type === "exposure" || body.type === "conversion" ? body.type : null;

    if (!experimentId || !variantId || !identity || !type) {
      return badRequest("Invalid A/B event payload.");
    }
    const definition = getExperimentDefinition(experimentId);
    if (!definition) return badRequest("Unknown experiment.");
    if (!definition.variants.some((variant) => variant.id === variantId)) {
      return badRequest("Unknown experiment variant.");
    }

    await writeAbLog({
      request,
      experimentId,
      variantId,
      type,
      identity,
      page,
      metadata: body.metadata,
    });
    return ok({ recorded: true });
  } catch (error) {
    return handleRouteError(error, { route: "/api/ab/events" });
  }
}
