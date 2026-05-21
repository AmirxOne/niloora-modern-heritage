import "dotenv/config";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { input } from "input";

function mustEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function main() {
  const apiId = Number(mustEnv("TELEGRAM_API_ID"));
  if (!Number.isFinite(apiId)) {
    throw new Error("TELEGRAM_API_ID must be a valid number");
  }
  const apiHash = mustEnv("TELEGRAM_API_HASH");

  const existing = process.env.TELEGRAM_STRING_SESSION?.trim() ?? "";
  const client = new TelegramClient(new StringSession(existing), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => input.text("Telegram phone number (with country code): "),
    password: async () => input.text("2FA password (if enabled): "),
    phoneCode: async () => input.text("Telegram login code: "),
    onError: (error) => {
      console.error("Telegram auth error:", error);
    },
  });

  const stringSession = client.session.save();
  console.log("\nTELEGRAM_STRING_SESSION=");
  console.log(stringSession);
  console.log(
    "\nCopy this into .env.local for TELEGRAM_STRING_SESSION, then run `npm run telegram:sync`."
  );
  await client.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

