import { getCatalogStone, getShankModel, SHANK_MASTERS } from "@/lib/customizer/catalog";
import type { CustomizerState } from "@/lib/types";

export function buildQuoteRequestTitle(state: CustomizerState): string {
  const shank = getShankModel(state.shankModelId);
  const stone = getCatalogStone(state.stone);
  const master = SHANK_MASTERS.find((m) => m.id === state.shankMaster);
  const parts = [shank?.name, stone?.name, master?.name].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "انگشتر سفارشی";
}
