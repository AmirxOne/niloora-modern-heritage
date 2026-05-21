import { calculateCustomizerPrice } from "@/lib/customizer-pricing";
import { sanitizeCustomizer } from "@/lib/store/customizer-utils";
import type { CustomizerState, SavedDesign } from "@/lib/types";
import { generateId } from "@/lib/utils";

export type SavedDesignsMergeStats = {
  mergedFromLocal: number;
  conflictsResolved: number;
  duplicatesRemoved: number;
};

export type SavedDesignsMergeResult = {
  designs: SavedDesign[];
  stats: SavedDesignsMergeStats;
};

function designTimestamp(design: SavedDesign): number {
  const raw = design.updatedAt ?? design.createdAt;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

function stateFingerprint(state: CustomizerState): string {
  return JSON.stringify(state);
}

/** Normalize name, state, and authoritative price for storage/sync. */
export function normalizeSavedDesign(raw: unknown): SavedDesign | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<SavedDesign>;
  const name = typeof row.name === "string" ? row.name.trim() : "";
  if (!name) return null;

  if (!row.state || typeof row.state !== "object") return null;
  const { state } = sanitizeCustomizer(row.state as CustomizerState);
  const price = calculateCustomizerPrice(state);

  const createdAt =
    typeof row.createdAt === "string" && row.createdAt
      ? row.createdAt
      : new Date().toISOString();
  const updatedAt =
    typeof row.updatedAt === "string" && row.updatedAt ? row.updatedAt : createdAt;

  return {
    id: typeof row.id === "string" && row.id ? row.id : generateId(),
    name,
    state,
    price,
    createdAt,
    updatedAt,
  };
}

export function normalizeSavedDesigns(raw: unknown): SavedDesign[] {
  if (!Array.isArray(raw)) return [];
  const out: SavedDesign[] = [];
  for (const item of raw) {
    const normalized = normalizeSavedDesign(item);
    if (normalized) out.push(normalized);
  }
  return out;
}

function pickNewer(a: SavedDesign, b: SavedDesign): SavedDesign {
  return designTimestamp(a) >= designTimestamp(b) ? a : b;
}

/**
 * Merge local (localStorage) and remote (account) saved designs.
 * - Union by id; same id → newer `updatedAt` wins.
 * - Duplicate configurations (fingerprint) collapse to one newest row.
 */
export function mergeSavedDesigns(
  localRaw: SavedDesign[],
  remoteRaw: SavedDesign[]
): SavedDesignsMergeResult {
  const local = normalizeSavedDesigns(localRaw);
  const remote = normalizeSavedDesigns(remoteRaw);

  const byId = new Map<string, SavedDesign>();
  let conflictsResolved = 0;

  for (const design of remote) {
    byId.set(design.id, design);
  }

  let mergedFromLocal = 0;
  for (const design of local) {
    const existing = byId.get(design.id);
    if (!existing) {
      byId.set(design.id, design);
      mergedFromLocal += 1;
      continue;
    }
    const chosen = pickNewer(existing, design);
    if (chosen.id === design.id && chosen !== existing) mergedFromLocal += 1;
    if (chosen !== existing || chosen !== design) conflictsResolved += 1;
    byId.set(design.id, chosen);
  }

  const byFingerprint = new Map<string, SavedDesign>();
  let duplicatesRemoved = 0;

  for (const design of Array.from(byId.values())) {
    const fp = stateFingerprint(design.state);
    const existing = byFingerprint.get(fp);
    if (!existing) {
      byFingerprint.set(fp, design);
      continue;
    }
    duplicatesRemoved += 1;
    byFingerprint.set(fp, pickNewer(existing, design));
  }

  const designs = Array.from(byFingerprint.values()).sort(
    (a, b) => designTimestamp(b) - designTimestamp(a)
  );

  return {
    designs,
    stats: { mergedFromLocal, conflictsResolved, duplicatesRemoved },
  };
}
