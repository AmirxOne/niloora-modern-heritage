import "dotenv/config";
import { runTelegramFullSync, runTelegramIncrementalSync, startTelegramRealtimeListener } from "@/lib/server/telegram/sync";

type Mode = "full" | "incremental" | "listen";

function readMode(): Mode {
  const mode = (process.argv[2] ?? "incremental").toLowerCase();
  if (mode === "full" || mode === "incremental" || mode === "listen") return mode;
  throw new Error("Usage: tsx scripts/telegram-sync.ts [full|incremental|listen]");
}

async function main() {
  const channel = process.env.TELEGRAM_CHANNEL ?? "galleryhannan";
  const mode = readMode();
  if (mode === "full") {
    const report = await runTelegramFullSync(channel);
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  if (mode === "incremental") {
    const report = await runTelegramIncrementalSync(channel);
    console.log(JSON.stringify(report, null, 2));
    return;
  }
  await startTelegramRealtimeListener(channel);
  console.log(`Telegram listener started for @${channel}.`);
  process.stdin.resume();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

