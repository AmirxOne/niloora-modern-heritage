import { getExperimentDefinition } from "@/lib/ab/experiments";
import { hashToPercent } from "@/lib/ab/hash";

export function assignExperimentVariant(
  experimentId: string,
  identity: string
): string | null {
  const definition = getExperimentDefinition(experimentId);
  if (!definition) return null;
  const bucket = hashToPercent(`${experimentId}:${identity}`);
  let cursor = 0;
  for (const variant of definition.variants) {
    cursor += variant.weight;
    if (bucket < cursor) return variant.id;
  }
  return definition.variants[definition.variants.length - 1]?.id ?? null;
}
