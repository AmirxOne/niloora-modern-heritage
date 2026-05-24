import { promises as fs } from "node:fs";
import path from "node:path";
import type { AbEventType } from "@/lib/ab/experiments";

type AbLogEntry = {
  at: string;
  experimentId: string;
  variantId: string;
  type: AbEventType;
  identity: string;
};

const STORE_FILE = path.join(process.cwd(), "data", "ab-tests", "events.jsonl");

export type AbVariantResult = {
  variantId: string;
  exposures: number;
  conversions: number;
  conversionRatePercent: number;
};

export type AbExperimentResult = {
  experimentId: string;
  variants: AbVariantResult[];
};

async function readEntries(): Promise<AbLogEntry[]> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as AbLogEntry;
        } catch {
          return null;
        }
      })
      .filter((item): item is AbLogEntry => item !== null);
  } catch {
    return [];
  }
}

export async function getAbResults(experimentId?: string): Promise<AbExperimentResult[]> {
  const rows = await readEntries();
  const filtered = experimentId ? rows.filter((row) => row.experimentId === experimentId) : rows;

  const group = new Map<string, Map<string, { exposures: Set<string>; conversions: Set<string> }>>();
  for (const row of filtered) {
    const byExperiment = group.get(row.experimentId) ?? new Map();
    const byVariant =
      byExperiment.get(row.variantId) ?? { exposures: new Set<string>(), conversions: new Set<string>() };
    if (row.type === "exposure") byVariant.exposures.add(row.identity);
    if (row.type === "conversion") byVariant.conversions.add(row.identity);
    byExperiment.set(row.variantId, byVariant);
    group.set(row.experimentId, byExperiment);
  }

  return Array.from(group.entries()).map(([id, byVariant]) => ({
    experimentId: id,
    variants: Array.from(byVariant.entries()).map(([variantId, stat]) => {
      const exposures = stat.exposures.size;
      const conversions = stat.conversions.size;
      const conversionRatePercent = exposures > 0 ? Number(((conversions / exposures) * 100).toFixed(2)) : 0;
      return { variantId, exposures, conversions, conversionRatePercent };
    }),
  }));
}
