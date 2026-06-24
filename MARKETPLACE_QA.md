# Niloora Marketplace — راهنمای QA دستی

این سند برای تأیید end-to-end جریان مارکت‌پلیس در staging/production است.  
تست‌های خودکار: `npm run test` — این چک‌لیست موارد تعاملی و یکپارچگی واقعی را پوشش می‌دهد.

---

## پیش‌نیاز

- دیتابیس migrate شده (`npm run prisma:migrate:deploy`)
- seed یا محصولات پلتفرم موجود
- حداقل یک حساب **admin** و یک کاربر عادی
- در staging: `ENABLE_MARKETPLACE_FILTER=true` (در production محلی معمولاً `false`)

---

## ۱. درخواست فروشنده → تأیید ادمین

1. با کاربر جدید به `/vendor/apply` بروید.
2. فرم همکاری را تکمیل و ارسال کنید.
3. با حساب **admin** به `/admin/vendors` بروید.
4. درخواست pending را باز کنید و **تأیید** کنید.
5. **انتظار:** وضعیت فروشنده `active`؛ کاربر به پنل فروشنده (`/vendor`) دسترسی دارد.

---

## ۲. ثبت محصول → ارسال → انتشار ادمین

1. با فروشنده وارد `/vendor/products` شوید.
2. محصول جدید بسازید (پیش‌نویس / `draft`).
3. دکمه **ارسال برای بررسی** را بزنید → وضعیت `pending_review`.
4. با admin به `/admin/products/pending` بروید.
5. محصول را **تأیید/انتشار** کنید → `published`.
6. **انتظار:** محصول در پنل فروشنده «منتشر شده» نمایش داده شود.

---

## ۳. فیلتر کاتالوگ (فقط staging)

1. در `.env` staging مقدار `ENABLE_MARKETPLACE_FILTER=true` تنظیم کنید.
2. سرور را restart کنید.
3. محصول **پیش‌نویس** یا فروشنده **غیرفعال** نباید در `/shop` دیده شود.
4. محصول **published** فروشنده active و محصولات پلتفرم (`vendorId` خالی) باید visible باشند.
5. با `ENABLE_MARKETPLACE_FILTER=false` تعداد محصولات باید مثل قبل (D2C کامل) باشد.

---

## ۴. سفارش → مشاهده فروشنده → ردیف دفترکل

1. محصول منتشرشده فروشنده را به سبد اضافه کنید.
2. checkout را تا **پرداخت موفق** (sandbox زرین‌پال) پیش ببرید.
3. با همان فروشنده به `/vendor/orders` بروید.
4. **انتظار:** سفارش/قلم مربوط به محصول خودش دیده شود (نه سفارش فروشنده دیگر).
5. با admin در `/admin/finance` یا API مالی فروشندگان بررسی کنید.
6. **انتظار:** ردیف `VendorPayoutLedger` با وضعیت `pending` برای آن `orderItem` وجود داشته باشد.

---

## ۵. سفارش محصول پلتفرم (بدون vendor)

1. یک محصول پلتفرمی (`vendorId` null) به سبد اضافه کنید.
2. سفارش را تکمیل و پرداخت کنید.
3. **انتظار:** سفارش موفق؛ **بدون** ردیف ledger فروشنده برای آن قلم.
4. سفارش‌های قدیمی بدون `vendorId` همچنان در `/account` و admin قابل مشاهده‌اند.

---

## ۶. checkout — پرداخت واحد بدون تغییر

1. سبد **مختلط** (محصول پلتفرم + فروشنده) بسازید.
2. checkout را انجام دهید.
3. **انتظار:**
   - **یک** سفارش (`Order`) و **یک** پرداخت زرین‌پال
   - هر `OrderItem` با `vendorId` صحیح (null برای پلتفرم)
   - هزینه ارسال و promo مثل قبل اعمال شود

---

## ۷. ایزولاسیون فروشنده (امنیت)

1. با فروشنده A سعی کنید محصول فروشنده B را از API ویرایش کنید:
   `PATCH /api/vendor/products/{id-فروشنده-B}`
2. **انتظار:** پاسخ **403** (`VENDOR_PRODUCT_FORBIDDEN`).

---

## ۸. داشبورد و تسویه فروشنده

1. `GET /api/vendor/dashboard` — ساختار `vendor`, `products`, `quota`, `orders`, `revenue`.
2. `GET /api/vendor/payouts` — فقط فروشنده active؛ شامل `pendingTotal`, `entries`.

---

## چک‌لیست نهایی ۱۰۰٪ MVP مارکت‌پلیس

- [ ] درخواست و تأیید فروشنده
- [ ] چرخه محصول: draft → pending → published
- [ ] فیلتر کاتالوگ در staging
- [ ] سفارش فروشنده + ledger
- [ ] سفارش پلتفرم بدون ledger
- [ ] سبد مختلط — یک سفارش / یک پرداخت
- [ ] ایزولاسیون PATCH محصول (403)
- [ ] داشبورد و payouts فروشنده
- [ ] کمیسیون ۱۰٪ روی gross (پیش‌فرض BPS=1000)
- [ ] `npm run test` و `npm run build` بدون خطا

---

## محدودیت‌های شناخته‌شده

- **جستجو:** `SEARCH_PROVIDER=local` — لاگ جستجوی واقعی برای analytics تقاضا هنوز placeholder است.
- **رتبه‌بندی:** `ENABLE_MARKETPLACE_RANKING=false` به‌صورت پیش‌فرض؛ ranking پیشرفته فقط با flag.
- **تسویه خودکار:** ledger ثبت می‌شود؛ payout بانکی خودکار خارج از MVP است.
- **چند فروشنده در یک سفارش:** یک Order واحد؛ تسویه per-vendor-item در ledger (نه split payment).
- **اعلان‌ها:** back-in-stock و demand analytics read-only؛ بدون سیستم push جدید.
- **Typesense:** stub — جستجوی production هنوز local است مگر `SEARCH_PROVIDER` تغییر کند.

---

*آخرین به‌روزرسانی: Phase F — Final Tests & E2E Verification*
