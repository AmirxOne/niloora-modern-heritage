import { mkdir } from "node:fs/promises";
import path from "node:path";

const UPLOAD_SUBDIR = "uploads/telegram";
const PROJECT_PUBLIC_DIR = path.join(process.cwd(), "public");

export function resolveTelegramUploadDir(channel: string): string {
  return path.join(PROJECT_PUBLIC_DIR, UPLOAD_SUBDIR, channel.replace(/^@/, ""));
}

export function publicTelegramMediaPrefix(channel: string): string {
  return `/${UPLOAD_SUBDIR}/${channel.replace(/^@/, "")}`;
}

export async function ensureTelegramUploadDir(channel: string): Promise<string> {
  const dir = resolveTelegramUploadDir(channel);
  await mkdir(dir, { recursive: true });
  return dir;
}

