import { promises as fs } from "node:fs";
import path from "node:path";
import type { AbEventType } from "@/lib/ab/experiments";

export type AbLogEntry = {
  id: string;
  at: string;
  experimentId: string;
  variantId: string;
  type: AbEventType;
  identity: string;
  page?: string;
  metadata?: string;
  ip?: string;
  userAgent?: string;
};

const STORE_DIR = path.join(process.cwd(), "data", "ab-tests");
const STORE_FILE = path.join(STORE_DIR, "events.jsonl");

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function ensureStore() {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function requestIp(request?: Request): string | undefined {
  if (!request) return undefined;
  const forwarded = request.headers.get("x-forwarded-for")?.trim();
  if (forwarded) return forwarded.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

function requestUserAgent(request?: Request): string | undefined {
  return request?.headers.get("user-agent")?.trim() || undefined;
}

function toMetadataText(value: unknown): string | undefined {
  if (value == null) return undefined;
  try {
    const json = JSON.stringify(value);
    if (!json) return undefined;
    return json.length > 1500 ? `${json.slice(0, 1500)}...` : json;
  } catch {
    return undefined;
  }
}

export async function writeAbLog(input: {
  request?: Request;
  experimentId: string;
  variantId: string;
  type: AbEventType;
  identity: string;
  page?: string;
  metadata?: unknown;
}) {
  await ensureStore();
  const entry: AbLogEntry = {
    id: generateId(),
    at: new Date().toISOString(),
    experimentId: input.experimentId,
    variantId: input.variantId,
    type: input.type,
    identity: input.identity,
    page: input.page,
    metadata: toMetadataText(input.metadata),
    ip: requestIp(input.request),
    userAgent: requestUserAgent(input.request),
  };
  await fs.appendFile(STORE_FILE, `${JSON.stringify(entry)}\n`, "utf8");
}
