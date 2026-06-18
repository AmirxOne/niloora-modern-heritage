/**
 * هم‌گام‌سازی چهار مقالهٔ بخش «خواندنی‌ها».
 * npx tsx prisma/scripts/seed-home-readings.ts
 */
import "dotenv/config";
import { ensureHomeReadingsPosts } from "../../src/lib/server/blog/ensure-home-readings";
import { listHomeReadingsPosts } from "../../src/lib/server/blog/post-service";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await ensureHomeReadingsPosts();
  const posts = await listHomeReadingsPosts();
  console.log(`Seeded ${posts.length} home readings posts:`);
  for (const post of posts) {
    console.log(`  - ${post.slug} → ${post.coverImage}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
