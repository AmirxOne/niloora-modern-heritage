import type { Prisma } from "@prisma/client";
import { buildQuoteRequestTitle } from "@/lib/customizer/quote-summary";
import { getVisibleWizardSteps, canProceedWizardStep } from "@/lib/customizer/wizard";
import { calculateCustomizerPrice } from "@/lib/customizer-pricing";
import { sanitizeCustomizerState } from "@/lib/customizer/compatibility";
import { customizerLabelMaps } from "@/lib/store/customizer-utils";
import { getShankModel } from "@/lib/customizer/catalog";
import { prisma } from "@/lib/server/prisma";
import { toQuoteRequestDto } from "@/lib/server/customizer/quote-request-dto";
import type { CustomizerState } from "@/lib/types";

export function createQuoteRequestId() {
  const stamp = Date.now().toString(36).toUpperCase();
  return `BQ-${stamp.slice(-8)}`;
}

function parseConfiguration(raw: unknown): CustomizerState | null {
  if (!raw || typeof raw !== "object") return null;
  const { state: sanitized } = sanitizeCustomizerState(raw as CustomizerState, customizerLabelMaps);
  if (!getShankModel(sanitized.shankModelId)) return null;

  const steps = getVisibleWizardSteps(sanitized);
  for (const step of steps) {
    if (!canProceedWizardStep(step, sanitized)) return null;
  }
  return sanitized;
}

export async function createCustomizerQuoteRequest(input: {
  userId: string;
  configuration: unknown;
  title?: string;
  customerNote?: string;
  estimateTotal?: number;
}) {
  const configuration = parseConfiguration(input.configuration);
  if (!configuration) {
    throw new Error("INVALID_CONFIGURATION");
  }

  const estimateTotal =
    typeof input.estimateTotal === "number" && input.estimateTotal > 0
      ? Math.round(input.estimateTotal)
      : calculateCustomizerPrice(configuration);

  const title =
    (input.title?.trim() || buildQuoteRequestTitle(configuration)).slice(0, 120) ||
    "انگشتر سفارشی";

  const customerNote = input.customerNote?.trim().slice(0, 500) || null;

  const row = await prisma.customizerQuoteRequest.create({
    data: {
      id: createQuoteRequestId(),
      userId: input.userId,
      status: "pending-quote",
      title,
      configuration: configuration as unknown as Prisma.InputJsonValue,
      estimateTotal,
      customerNote,
    },
  });

  return toQuoteRequestDto(row);
}

export async function listCustomizerQuoteRequestsForUser(userId: string) {
  const rows = await prisma.customizerQuoteRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toQuoteRequestDto);
}
