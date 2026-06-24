# Niloora — چک‌لیست راه‌اندازی مارکت‌پلیس (Ops)

سند عملیاتی برای deploy و launch مارکت‌پلیس. **بدون تغییر کد** — فقط migration، env، flag و پایش.

مرجع QA دستی: [`MARKETPLACE_QA.md`](../MARKETPLACE_QA.md) در ریشه repo.

---

## ۱. Migrationهای production (به ترتیب)

روی production **همیشه** یک دستور واحد اجرا کنید؛ Prisma migrationها را به ترتیب timestamp اعمال می‌کند:

```bash
npx prisma migrate deploy
```

Migrationهای **حیاتی مارکت‌پلیس** (در صورت deploy تازه، این‌ها باید قبل از فعال‌سازی فروشنده اعمال شده باشند):

| # | Migration | محتوا |
|---|-----------|--------|
| 1 | `20260624120000_order_finalization_inventory` | `Order.finalizedAt`، commit موجودی — پایه idempotency پرداخت |
| 2 | `20260624140000_marketplace_domain_prep` | جدول `Vendor`، `Product.vendorId`، `publicationStatus` (محصولات قدیمی: `vendorId` null، `published`) |
| 3 | `20260624160000_marketplace_phase2` | workflow فروشنده، `OrderItem.vendorId`، moderation، quota |
| 4 | `20260625120000_vendor_finance` | `VendorCommissionRule`، `VendorPayoutLedger` |

**قبل از migrate:**
- backup کامل PostgreSQL
- maintenance window کوتاه (یا read-only موقت) در ساعات کم‌ترافیک

**بعد از migrate:**
```bash
npx prisma migrate status   # همه applied باشند
```
- smoke test: `/shop`، `/admin`، `/vendor/apply`
- نیازی به seed اجباری نیست؛ محصولات پلتفرم موجود بدون `vendorId` معتبرند

---

## ۲. متغیرهای محیط — Staging در برابر Production

### Staging (تست end-to-end)

| متغیر | مقدار پیشنهادی | توضیح |
|--------|----------------|--------|
| `NEXT_PUBLIC_SITE_URL` | URL staging | callback پرداخت و SEO |
| `DATABASE_URL` | DB جدا از production | **هرگز** DB production را روی staging وصل نکنید |
| `SESSION_SECRET` | secret مستقل | متفاوت از production |
| `ENABLE_MARKETPLACE_FILTER` | **`true`** | فیلتر published + vendor active را از قبل تست کنید |
| `ENABLE_MARKETPLACE_RANKING` | `false` (یا `true` برای تست ranking) | اختیاری |
| `SEARCH_PROVIDER` | `local` | |
| `VENDOR_DEFAULT_COMMISSION_BPS` | `1000` (۱۰٪) | |
| `ZARINPAL_SANDBOX` | **`true`** | پرداخت آزمایشی |
| `ZARINPAL_MERCHANT_ID` | merchant sandbox | |
| `SENTRY_ENVIRONMENT` | `staging` | |
| `ABANDONED_CART_CRON_SECRET` | secret staging | |
| `NOTIFY_ENABLED` | `true` | SMS واقعی یا mock بسته به سیاست تیم |

### Production (روز launch)

| متغیر | مقدار launch | توضیح |
|--------|--------------|--------|
| `ENABLE_MARKETPLACE_FILTER` | **`false`** | تا رسیدن به آستانه N/M (بخش ۳) — کاتالوگ D2C کامل حفظ می‌شود |
| `ENABLE_MARKETPLACE_RANKING` | `false` | فعال‌سازی بعد از پایدار شدن فیلتر |
| `SEARCH_PROVIDER` | `local` | |
| `VENDOR_DEFAULT_COMMISSION_BPS` | `1000` | مگر rule اختصاصی per-vendor در DB |
| `ZARINPAL_SANDBOX` | **`false`** | پرداخت زنده |
| `ZARINPAL_MERCHANT_ID` | merchant production | یا از admin site settings |
| `SENTRY_ENVIRONMENT` | `production` | |
| `ABANDONED_CART_CRON_SECRET` | secret قوی | cronها فعال |
| `DATABASE_URL` / `SESSION_SECRET` / `NEXT_PUBLIC_SITE_URL` | مقادیر production | طبق [`docs/production.md`](production.md) |

**بعد از هر تغییر env:** restart/redeploy اپ (flagها در runtime خوانده می‌شوند).

---

## ۳. چه زمانی `ENABLE_MARKETPLACE_FILTER=true`؟

فیلتر وقتی روشن شود که **هم** عرضه فروشنده **و** آمادگی ops تأیید شده باشد.

### آستانه‌های پیشنهادی (N و M را تیم ops ثبت کند)

| نماد | معنی | پیشنهاد launch | حداقل مطلق |
|------|------|----------------|------------|
| **N** | تعداد فروشنده با `status = active` | **N ≥ 5** | 3 |
| **M** | تعداد SKU فروشنده با `publicationStatus = published` و `vendorId` غیر null | **M ≥ 20** | 10 |

### معیارهای go/no-go (همه باید برقرار باشند)

- [ ] N فروشنده active تأیید شده (اطلاعات تماس و quota بررسی شده)
- [ ] M محصول vendor منتشر شده با تصویر و قیمت معتبر
- [ ] حداقل یک سفارش تست موفق روی **staging** با `FILTER=true` انجام شده
- [ ] صف `/admin/products/pending` خالی یا زیر ۵ مورد
- [ ] admin آموزش دیده: approve vendor، publish product، finance

### ترتیب فعال‌سازی روی production

1. ابتدا migrationها deploy شده باشند (`FILTER` می‌تواند هنوز `false` باشد)
2. onboard فروشندگان و publish محصولات **بدون** فیلتر (محصول draft در shop دیده نمی‌شود مگر filter off و… — در حالت filter off همه published پلتفرم visible هستند؛ محصول vendor تا publish admin در shop نیست اگر filter off باشد چون publicationStatus باید published باشد — actually with filter OFF, mergePublicCatalogWhere doesn't filter by publicationStatus, so draft vendor products might show? Let me check.

From catalog-filter.ts - when flag OFF, no publicationStatus filter. So draft vendor products COULD show in shop if filter is off! That's important for ops doc.

Actually when filter is OFF:
```typescript
return base ?? {};  // no publication filter
```

So unpublished vendor products might appear in catalog when filter is off! That's a risk. The ops doc should say: keep vendor products in draft until ready, OR enable filter when going live with vendors.

I'll mention: قبل از onboard گسترده، محصولات vendor را فقط در draft نگه دارید؛ یا فیلتر را زودتر روی staging فعال کنید. On production with filter false, only products with publicationStatus matter for... actually ALL products in DB show if no filter. So draft products would show too unless there's another filter.

Let me check fetchCatalogRows / mergePublicCatalogWhere usage - when filter off, draft vendor products appear in shop. Important ops note!

I'll add warning in launch doc: با `ENABLE_MARKETPLACE_FILTER=false` محصولات `draft` فروشنده هم ممکن است در `/shop` دیده شوند — تا زمان فعال‌سازی فیلتر، محصولات vendor را publish نکنید مگر آماده نمایش عمومی باشند، یا فیلتر را به‌محض داشتن inventory vendor روشن کنید.

Actually re-read buildPublicCatalogProductWhere - when disabled, no filter at all. So yes draft products visible. Critical ops note.

3. وقتی N و M برآورده شد → `ENABLE_MARKETPLACE_FILTER=true` + redeploy
4. ۲۴–۴۸ ساعت پایش (بخش ۶)
5. در صورت نیاز `ENABLE_MARKETPLACE_RANKING=true` (فاز بعد)

---

## ۴. Rollback

**سریع‌ترین rollback بدون migration معکوس:**

```env
ENABLE_MARKETPLACE_FILTER=false
ENABLE_MARKETPLACE_RANKING=false
```

→ redeploy/restart

**اثر:**
- کاتالوگ عمومی مثل حالت D2C قبلی (بدون فیلتر publication/vendor)
- ledger و سفارش‌های ثبت‌شده **حذف نمی‌شوند**
- پنل فروشنده و admin همچنان کار می‌کنند

**Rollback schema (فقط در emergency و با backup):**
- migration معکوس در repo تعریف نشده — rollback DB دستی توصیه **نمی‌شود**
- در صورت corruption: restore از backup + flag false

**بعد از rollback:**
- صف pending را بررسی کنید
- سفارش‌های in-flight را در `/admin/orders` پیگیری کنید

---

## ۵. Ops هفته اول — Admin

### روزانه (هر صبح)

| کار | مسیر | هدف |
|-----|------|-----|
| تأیید فروشنده | `/admin/vendors` | صف `pending_review` → `active` |
| انتشار محصول | `/admin/products/pending` | `pending_review` → `published` |
| بررسی تقاضا | `/admin` (ویجت تقاضای باز) | wishlist + back-in-stock |
| سفارش‌ها | `/admin/orders` | سفارش‌های paid/processing |

### هفتگی

| کار | مسیر |
|-----|------|
| مالی مارکت‌پلیس | `/admin/finance` + finance vendors |
| back-in-stock | `/admin/back-in-stock-alerts` |
| audit نمونه | `/admin/audit-logs` |

### SLA پیشنهادی هفته اول

- درخواست فروشنده: پاسخ ≤ **۲۴ ساعت**
- محصول pending: بررسی ≤ **۴۸ ساعت**
- سفارش vendor: همان SLA پلتفرم

### red flags (اقدام فوری)

- صف pending محصول > **۱۰**
- فروشنده active بدون هیچ محصول published > **۷ روز**
- اختلاف ledger vs سفارش (بخش ۶) > **۰**

---

## ۶. Monitoring — Ledger در برابر سفارش‌های paid

### هدف

برای هر `OrderItem` با `vendorId` غیر null در سفارش **paid/finalized**، دقیقاً **یک** ردیف `VendorPayoutLedger` (status ≠ `reversed`) انتظار می‌رود.

### KPI روزانه

| متریک | توضیح |
|--------|--------|
| `paid_vendor_items` | تعداد اقلام paid با vendorId |
| `ledger_rows` | تعداد ledger matching (status not reversed) |
| **delta** | `paid_vendor_items - ledger_rows` → باید **۰** |

### کوئری‌های نمونه (PostgreSQL)

**اقلام paid با vendor (از ۷ روز اخیر):**
```sql
SELECT COUNT(*) AS paid_vendor_items
FROM "OrderItem" oi
JOIN "Order" o ON o.id = oi."orderId"
WHERE oi."vendorId" IS NOT NULL
  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
  AND o."finalizedAt" IS NOT NULL
  AND o."createdAt" >= NOW() - INTERVAL '7 days';
```

**ردیف‌های ledger متناظر:**
```sql
SELECT COUNT(*) AS ledger_rows
FROM "VendorPayoutLedger" l
JOIN "Order" o ON o.id = l."orderId"
WHERE l.status <> 'reversed'
  AND o."finalizedAt" IS NOT NULL
  AND o."createdAt" >= NOW() - INTERVAL '7 days';
```

**اقلام بدون ledger (باید خالی باشد):**
```sql
SELECT oi.id, oi."orderId", oi."vendorId", o.status, o."finalizedAt"
FROM "OrderItem" oi
JOIN "Order" o ON o.id = oi."orderId"
LEFT JOIN "VendorPayoutLedger" l ON l."orderItemId" = oi.id AND l.status <> 'reversed'
WHERE oi."vendorId" IS NOT NULL
  AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
  AND o."finalizedAt" IS NOT NULL
  AND l.id IS NULL
ORDER BY o."createdAt" DESC
LIMIT 50;
```

### پایش تکمیلی

- **Sentry:** spike خطای `/api/orders`، finalize payment، vendor routes
- **Health:** `GET /api/health?detailed=1` + `x-health-secret`
- **Cron:** abandoned-cart و inventory-retry بدون 401

### سفارش‌های legacy (بدون vendorId)

- `OrderItem.vendorId IS NULL` → **ledger انتظار نمی‌رود** — در KPI بالا exclude شده‌اند

---

## چک‌لیست launch (خلاصه)

- [ ] Backup DB
- [ ] `npx prisma migrate deploy`
- [ ] env production با `ENABLE_MARKETPLACE_FILTER=false`
- [ ] staging با `FILTER=true` تست شده
- [ ] N فروشنده active، M SKU published
- [ ] `ENABLE_MARKETPLACE_FILTER=true` + redeploy
- [ ] monitoring ledger delta = 0
- [ ] admin rota هفته اول تعیین شده

---

*Ops — Marketplace Launch. آخرین به‌روزرسانی: Phase F.*
