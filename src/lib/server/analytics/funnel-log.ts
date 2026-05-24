import { promises as fs } from "node:fs";
import path from "node:path";
import type { FunnelEventPayload } from "@/lib/analytics/funnel-events";

const STORE_DIR = path.join(process.cwd(), "data", "analytics");
const STORE_FILE = path.join(STORE_DIR, "funnel-events.jsonl");

function requestIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

function requestUserAgent(request?: Request): string | undefined {
  return request?.headers.get("user-agent")?.trim() || undefined;
}

type StoredFunnelEvent = FunnelEventPayload & {
  ip?: string;
  user_agent?: string;
};

async function ensureStore() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

export async function writeFunnelEvent(payload: FunnelEventPayload, request?: Request) {
  await ensureStore();
  const row: StoredFunnelEvent = {
    ...payload,
    ip: requestIp(request),
    user_agent: requestUserAgent(request),
  };
  await fs.appendFile(STORE_FILE, `${JSON.stringify(row)}\n`, "utf8");
}
