let lockUntilMs = 0;

export type SettlementRunLock = {
  release: () => void;
};

/**
 * Process-local lock for settlement run endpoint.
 * Prevents accidental concurrent admin-triggered runs in a single runtime.
 */
export function acquireSettlementRunLock(ttlMs = 120_000): SettlementRunLock | null {
  const now = Date.now();
  if (lockUntilMs > now) return null;
  lockUntilMs = now + ttlMs;
  let released = false;
  return {
    release: () => {
      if (released) return;
      released = true;
      lockUntilMs = 0;
    },
  };
}
