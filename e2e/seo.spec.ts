import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { ALPHA_PRODUCT_ID, TEST_SELLER_PHONE, TEST_PASSWORD } from "./helpers";

/**
 * SEO E2E — verifies metadata, canonical, robots, sitemap, structured data
 * and Persian search normalization against the RUNNING app (test DB).
 */

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3100";

/** The app caches the catalog in Redis — psql-inserted rows bypass the
 * API invalidation, so bump the version key before reading via API. */
function flushCatalogCache(): void {
  try {
    execSync(
      `docker exec meetinghub-redis-1 redis-cli INCR niloora:cache:version:catalog:catalog`,
      { encoding: "utf8", stdio: "pipe" }
    );
  } catch {
    /* redis not present in this environment — cache stays hot, TTL handles it */
  }
}

function psql(sql: string): string {
  const oneLine = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec meetinghub-postgres-1 psql -U meetinghub -d niloora_test -t -A -c ${JSON.stringify(oneLine)}`,
    { encoding: "utf8" }
  ).trim();
}

test.describe("robots.txt", () => {
  test("blocks private routes, allows public + sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /seller");
    expect(body).toContain("Disallow: /cart");
    expect(body).toContain("Disallow: /compare");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
  });
});

test.describe("sitemap.xml", () => {
  test("contains canonical URLs only (no query strings, no private paths)", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();

    // product + static present
    expect(xml).toContain(`/product/${ALPHA_PRODUCT_ID}`);
    expect(xml).toContain("<loc>");

    // no query-string collection URLs anymore
    expect(xml).not.toContain("collection=");

    // private paths never leak
    for (const banned of ["/admin", "/seller", "/account", "/cart", "/auth"]) {
      expect(xml).not.toContain(`>${BASE}${banned}`);
    }
  });

  test("excludes suspended sellers' products, includes active seller products", async ({ request }) => {
    // seed a suspended-seller product + an active-seller product
    const sellerActiveId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-a'`);
    const sellerSuspendId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-b'`);
    psql(`
      INSERT INTO "Product" (id, name, "namePersian", price, image, category, metal, stone, "stoneShape", "engravingType", availability, stock, "sellerId", condition, "createdAt", "updatedAt")
      VALUES ('seo-active-ring', 'SEO Active', 'فعال', 10000000, '/x.jpg', 'solitaire', 'sterling', 'onyx', 'round', 'none', 'ready', 1, '${sellerActiveId}', 'new', NOW(), NOW()),
             ('seo-suspended-ring', 'SEO Suspended', 'معلق', 10000000, '/x.jpg', 'solitaire', 'sterling', 'onyx', 'round', 'none', 'ready', 1, '${sellerSuspendId}', 'new', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    psql(`UPDATE "Seller" SET status='suspended' WHERE id='${sellerSuspendId}'`);

    const res = await request.get("/sitemap.xml");
    const xml = await res.text();
    expect(xml).toContain("seo-active-ring");
    expect(xml).not.toContain("seo-suspended-ring");

    // restore + cleanup
    psql(`UPDATE "Seller" SET status='active' WHERE id='${sellerSuspendId}'`);
    psql(`DELETE FROM "Product" WHERE id IN ('seo-active-ring','seo-suspended-ring')`);
  });
});

test.describe("product page SEO", () => {
  test("server-rendered title, meta description, canonical, JSON-LD", async ({ request }) => {
    const res = await request.get(`/product/${ALPHA_PRODUCT_ID}`);
    expect(res.status()).toBe(200);
    const html = await res.text();

    // canonical + og present in the FIRST server response
    expect(html).toContain('rel="canonical"');
    expect(html).toContain(`${BASE}/product/${ALPHA_PRODUCT_ID}`);
    expect(html).toContain('property="og:title"');

    // JSON-LD product + breadcrumb
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toContain('"priceCurrency":"IRR"');
    // toman→rial conversion in structured data (60M toman = 600M rial)
    expect(html).toContain('"price":600000000');
  });

  test("unknown product returns real 404 status", async ({ request }) => {
    const res = await request.get("/product/does-not-exist-at-all");
    expect(res.status()).toBe(404);
  });

  test("suspended seller's product page is noindex", async () => {
    const sellerSuspendId = psql(`SELECT id FROM "Seller" WHERE slug='e2e-shop-b'`);
    psql(`
      INSERT INTO "Product" (id, name, "namePersian", price, image, category, metal, stone, "stoneShape", "engravingType", availability, stock, "sellerId", condition, "createdAt", "updatedAt")
      VALUES ('seo-noindex-ring', 'SEO Noindex', 'بدون ایندکس', 10000000, '/x.jpg', 'solitaire', 'sterling', 'onyx', 'round', 'none', 'ready', 1, '${sellerSuspendId}', 'new', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    psql(`UPDATE "Seller" SET status='suspended' WHERE id='${sellerSuspendId}'`);

    const res = await fetch(`${BASE}/product/seo-noindex-ring`);
    const html = await res.text();
    expect(html).toContain('noindex');

    psql(`UPDATE "Seller" SET status='active' WHERE id='${sellerSuspendId}'`);
    psql(`DELETE FROM "Product" WHERE id='seo-noindex-ring'`);
  });
});

test.describe("Persian search normalization", () => {
  test("arabic ي/ك query matches persian ی/ک data", async ({ request }) => {
    // seed a product with PERSIAN letters in its name
    psql(`
      INSERT INTO "Product" (id, name, "namePersian", price, image, category, metal, stone, "stoneShape", "engravingType", availability, stock, condition, "createdAt", "updatedAt")
      VALUES ('seo-norm-ring', 'Norm Ring', 'انگشتر یکتا', 10000000, '/x.jpg', 'solitaire', 'sterling', 'onyx', 'round', 'none', 'ready', 1, 'new', NOW(), NOW())
      ON CONFLICT DO NOTHING
    `);
    psql(`INSERT INTO "ProductListing" (\"productId\", tier, headline, details) VALUES ('seo-norm-ring', 'premium', 'تست', '["x"]') ON CONFLICT DO NOTHING`);

    try {
      flushCatalogCache();
      // query with ARABIC ي and ك
      const res = await request.get(`/api/products/search?q=${encodeURIComponent("یکتا".replace(/ی/g, "ي").replace(/ک/g, "ك"))}`);
      expect(res.status()).toBe(200);
      const data = await res.json();
      const hit = data.products.catalog.find(
        (p: { id: string }) => p.id === "seo-norm-ring"
      );
      expect(hit).toBeTruthy();
    } finally {
      psql(`DELETE FROM "ProductListing" WHERE "productId"='seo-norm-ring'`);
      psql(`DELETE FROM "Product" WHERE id='seo-norm-ring'`);
    }
  });
});

test.describe("blog structured data", () => {
  test("blog list page is reachable and indexable", async ({ request }) => {
    const res = await request.get("/blog");
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('rel="canonical"');
  });
});

test.describe("slug helper (unit-level via API behavior)", () => {
  test("shop query params don't break canonical (static metadata)", async ({ request }) => {
    const res = await request.get("/shop?collection=royal-heritage");
    const html = await res.text();
    // canonical stays the clean /shop for filter permutations
    expect(html).toContain('<link rel="canonical" href="http://localhost:3100/shop"');
  });
});
