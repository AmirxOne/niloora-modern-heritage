import { StringSession } from "telegram/sessions";
import { TelegramClient } from "telegram";
import { Api } from "telegram/tl";
import { FloodWaitError } from "telegram/errors/RPCErrorList";

type TelegramEnv = {
  apiId: number;
  apiHash: string;
  stringSession: string;
};

function readTelegramEnv(): TelegramEnv {
  const apiIdRaw = process.env.TELEGRAM_API_ID ?? "";
  const apiHash = process.env.TELEGRAM_API_HASH ?? "";
  const stringSession = process.env.TELEGRAM_STRING_SESSION ?? "";
  const apiId = Number(apiIdRaw);
  if (!Number.isFinite(apiId) || !apiHash || !stringSession) {
    throw new Error(
      "Missing TELEGRAM credentials. Required: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_STRING_SESSION"
    );
  }
  return { apiId, apiHash, stringSession };
}

export async function createTelegramClient(): Promise<TelegramClient> {
  const env = readTelegramEnv();
  const client = new TelegramClient(new StringSession(env.stringSession), env.apiId, env.apiHash, {
    connectionRetries: 5,
  });
  await client.start({
    phoneNumber: async () => "",
    password: async () => "",
    phoneCode: async () => "",
    onError: (error) => {
      console.error("Telegram client start error:", error);
    },
  });
  return client;
}

export function isTelegramMediaMessage(message: Api.Message): boolean {
  return Boolean(message.media && !(message.media instanceof Api.MessageMediaWebPage));
}

export async function withFloodWaitRetry<T>(operation: () => Promise<T>, maxRetries = 5): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof FloodWaitError && attempt < maxRetries) {
        attempt += 1;
        const waitMs = (error.seconds + 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
}

