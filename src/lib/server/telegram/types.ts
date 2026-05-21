export type TelegramProductAttributes = Record<string, string | number | boolean>;

export type TelegramProductDto = {
  id: string;
  title: string | null;
  description: string;
  tags: string[];
  attributes: TelegramProductAttributes;
  images: string[];
  telegramMessageId: number;
  telegramDate: string;
  sourceChannel: string;
  rawText: string | null;
  hasMedia: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExtractedTelegramSignal = {
  title: string | null;
  description: string;
  tags: string[];
  attributes: TelegramProductAttributes;
  rawText: string | null;
  hasProductSignal: boolean;
};

export type TelegramSyncMode = "full" | "incremental";

export type TelegramSyncReport = {
  channel: string;
  mode: TelegramSyncMode;
  scannedMessages: number;
  upsertedProducts: number;
  downloadedImages: number;
  lastMessageId: number;
};

