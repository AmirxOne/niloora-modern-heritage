import path from "node:path";
import { Api } from "telegram/tl";
import type { TelegramClient } from "telegram";
import { NewMessage } from "telegram/events";
import { prisma } from "@/lib/server/prisma";
import { createTelegramClient, isTelegramMediaMessage, withFloodWaitRetry } from "@/lib/server/telegram/client";
import { extractTelegramSignal } from "@/lib/server/telegram/extractor";
import { ensureTelegramUploadDir, publicTelegramMediaPrefix } from "@/lib/server/telegram/media";
import type { TelegramProductDto, TelegramSyncMode, TelegramSyncReport } from "@/lib/server/telegram/types";

const DEFAULT_CHANNEL = "galleryhannan";
const DEFAULT_BATCH_SIZE = 100;

function channelName(channel: string): string {
  return channel.replace(/^@/, "").trim();
}

function toDto(row: {
  id: string;
  title: string | null;
  description: string;
  tags: unknown;
  attributes: unknown;
  images: unknown;
  telegramMessageId: number;
  telegramDate: Date;
  sourceChannel: string;
  rawText: string | null;
  hasMedia: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TelegramProductDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    attributes:
      row.attributes && typeof row.attributes === "object" && !Array.isArray(row.attributes)
        ? (row.attributes as Record<string, string | number | boolean>)
        : {},
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
    telegramMessageId: row.telegramMessageId,
    telegramDate: row.telegramDate.toISOString(),
    sourceChannel: row.sourceChannel,
    rawText: row.rawText,
    hasMedia: row.hasMedia,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function downloadMessageMedia(
  client: TelegramClient,
  message: Api.Message,
  channel: string
): Promise<string[]> {
  if (!isTelegramMediaMessage(message)) return [];
  const uploadDir = await ensureTelegramUploadDir(channel);
  const fileName = `${message.id}-${Date.now()}`;
  const outPath = path.join(uploadDir, fileName);
  const result = await withFloodWaitRetry(() =>
    client.downloadMedia(message, {
      outputFile: outPath,
    })
  );
  if (typeof result !== "string" || !result) return [];
  const normalized = result.replace(/\\/g, "/");
  const relative = normalized.split("/public/")[1];
  if (!relative) return [`${publicTelegramMediaPrefix(channel)}/${path.basename(result)}`];
  return [`/${relative}`];
}

async function upsertFromMessage(
  client: TelegramClient,
  message: Api.Message,
  channel: string
): Promise<{ saved: boolean; downloadedImages: number }> {
  if (!message.id) return { saved: false, downloadedImages: 0 };
  const extracted = extractTelegramSignal(message.message);
  if (!extracted.hasProductSignal && !isTelegramMediaMessage(message)) {
    return { saved: false, downloadedImages: 0 };
  }

  const images = await downloadMessageMedia(client, message, channel);
  const rawDate = message.date as unknown;
  const telegramDate =
    typeof rawDate === "number"
      ? new Date(rawDate * 1000)
      : rawDate && typeof rawDate === "object"
        ? new Date(rawDate as Date)
        : new Date();

  await prisma.telegramProduct.upsert({
    where: {
      sourceChannel_telegramMessageId: {
        sourceChannel: channel,
        telegramMessageId: message.id,
      },
    },
    create: {
      title: extracted.title,
      description: extracted.description,
      tags: extracted.tags,
      attributes: extracted.attributes,
      images,
      telegramMessageId: message.id,
      telegramDate,
      sourceChannel: channel,
      rawText: extracted.rawText,
      hasMedia: images.length > 0,
    },
    update: {
      title: extracted.title,
      description: extracted.description,
      tags: extracted.tags,
      attributes: extracted.attributes,
      images,
      telegramDate,
      rawText: extracted.rawText,
      hasMedia: images.length > 0,
    },
  });

  return { saved: true, downloadedImages: images.length };
}

async function setSyncState(channel: string, lastMessageId: number, lastError?: string): Promise<void> {
  await prisma.telegramSyncState.upsert({
    where: { channel },
    create: {
      channel,
      lastMessageId,
      lastSyncedAt: new Date(),
      lastError: lastError ?? null,
    },
    update: {
      lastMessageId,
      lastSyncedAt: new Date(),
      lastError: lastError ?? null,
    },
  });
}

async function getLastMessageId(channel: string): Promise<number> {
  const state = await prisma.telegramSyncState.findUnique({ where: { channel } });
  return state?.lastMessageId ?? 0;
}

export async function syncTelegramChannel(options?: {
  channel?: string;
  mode?: TelegramSyncMode;
  batchSize?: number;
}): Promise<TelegramSyncReport> {
  const channel = channelName(options?.channel ?? process.env.TELEGRAM_CHANNEL ?? DEFAULT_CHANNEL);
  const mode: TelegramSyncMode = options?.mode ?? "incremental";
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const client = await createTelegramClient();
  let scannedMessages = 0;
  let upsertedProducts = 0;
  let downloadedImages = 0;
  let maxMessageId = 0;
  try {
    const minId = mode === "full" ? 0 : await getLastMessageId(channel);
    for await (const message of client.iterMessages(channel, {
      reverse: true,
      minId,
      limit: undefined,
      waitTime: 1,
    })) {
      scannedMessages += 1;
      if (!(message instanceof Api.Message)) continue;
      const result = await upsertFromMessage(client, message, channel);
      if (result.saved) {
        upsertedProducts += 1;
        downloadedImages += result.downloadedImages;
      }
      maxMessageId = Math.max(maxMessageId, message.id ?? 0);
      if (batchSize > 0 && scannedMessages % batchSize === 0) {
        await setSyncState(channel, Math.max(minId, maxMessageId));
      }
    }
    const lastMessageId = Math.max(await getLastMessageId(channel), maxMessageId);
    await setSyncState(channel, lastMessageId);
    return { channel, mode, scannedMessages, upsertedProducts, downloadedImages, lastMessageId };
  } catch (error) {
    const lastMessageId = Math.max(await getLastMessageId(channel), maxMessageId);
    await setSyncState(channel, lastMessageId, error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await client.disconnect();
  }
}

export async function runTelegramIncrementalSync(channel = DEFAULT_CHANNEL): Promise<TelegramSyncReport> {
  return syncTelegramChannel({ channel, mode: "incremental" });
}

export async function runTelegramFullSync(channel = DEFAULT_CHANNEL): Promise<TelegramSyncReport> {
  return syncTelegramChannel({ channel, mode: "full" });
}

export async function listTelegramProducts(options?: {
  channel?: string;
  query?: string;
  limit?: number;
}): Promise<TelegramProductDto[]> {
  const channel = channelName(options?.channel ?? process.env.TELEGRAM_CHANNEL ?? DEFAULT_CHANNEL);
  const query = options?.query?.trim();
  const rows = await prisma.telegramProduct.findMany({
    where: {
      sourceChannel: channel,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { rawText: { contains: query, mode: "insensitive" } },
              { tags: { array_contains: [query] } },
            ],
          }
        : {}),
    },
    orderBy: [{ telegramDate: "desc" }],
    take: options?.limit ?? 200,
  });
  return rows.map(toDto);
}

export async function getTelegramProductById(id: string): Promise<TelegramProductDto | null> {
  const row = await prisma.telegramProduct.findUnique({ where: { id } });
  return row ? toDto(row) : null;
}

export async function startTelegramRealtimeListener(channel = DEFAULT_CHANNEL): Promise<void> {
  const normalized = channelName(channel);
  const client = await createTelegramClient();
  await prisma.telegramSyncState.upsert({
    where: { channel: normalized },
    create: { channel: normalized, listenerEnabled: true },
    update: { listenerEnabled: true, lastError: null },
  });

  client.addEventHandler(async (event) => {
    const message = event.message;
    if (!(message instanceof Api.Message)) return;
    try {
      const result = await upsertFromMessage(client, message, normalized);
      const latest = message.id ?? 0;
      if (result.saved && latest > 0) {
        await setSyncState(normalized, latest);
      }
    } catch (error) {
      await prisma.telegramSyncState.update({
        where: { channel: normalized },
        data: { lastError: error instanceof Error ? error.message : String(error) },
      });
    }
  }, new NewMessage({ chats: [normalized] }));
}

