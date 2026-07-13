/**
 * Settlement cron: scan the vendor ledger for delivered, return-free orders
 * past the settlement hold window and create payable Settlement records.
 * Idempotent and replay-safe — running repeatedly never double-settles.
 *
 * Usage: npx tsx scripts/run-settlements.ts
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function main() {
  const { runSettlementEngine } = await import(
    "../src/lib/server/marketplace/settlement/settlement-service"
  );
  const { dispatchDomainEvents, ensureDefaultDomainEventHandlers } = await import(
    "../src/lib/server/marketplace/events/domain-events"
  );

  const result = await runSettlementEngine({ actorId: "cron:settlement" });

  ensureDefaultDomainEventHandlers();
  const dispatch = await dispatchDomainEvents();

  console.log(
    `Settlement run: evaluated=${result.evaluated} settled=${result.settled} ` +
      `deduped=${result.deduped} skipped=${result.skipped} netSettled=${result.totalNetSettled}`
  );
  console.log(`Dispatched ${dispatch.processed} event(s); ${dispatch.failed} failed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/server/prisma");
    await prisma.$disconnect();
  });
