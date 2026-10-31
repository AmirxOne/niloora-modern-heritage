"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSellerPanel, type SellerOverview } from "@/lib/hooks/useSellerPanel";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextBox, TextAreaBox } from "@/components/inputs";

const t = fa.sellerPanel;

function RegisterShopForm({ onSubmit }: { onSubmit: (input: {
  shopName: string; slug: string; bio?: string; phone?: string;
}) => Promise<boolean> }) {
  const [shopName, setShopName] = useState("");
  const [slug, setSlug] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <form
      className="seller-register-form panel-card mx-auto max-w-lg space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ shopName, slug, bio, phone });
      }}
    >
      <TextBox
        label={t.shopName}
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder={t.shopNamePlaceholder}
        required
      />
      <TextBox
        label={t.slug}
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        placeholder={t.slugPlaceholder}
        inputClassName="auth-input-ltr"
        required
      />
      <p className="-mt-2 text-xs text-silver">{t.slugHint}</p>
      <TextAreaBox
        label={t.bio}
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder={t.bioPlaceholder}
        rows={3}
      />
      <TextBox
        label={t.phone}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
        inputClassName="auth-input-ltr"
      />
      <Button type="submit" size="lg" className="w-full">
        {t.submit}
      </Button>
    </form>
  );
}

function StatsCards({ overview }: { overview: SellerOverview }) {
  const items = [
    { label: t.statsProducts, value: overview.stats.products.toLocaleString("fa-IR") },
    { label: t.statsSold, value: overview.stats.soldItems.toLocaleString("fa-IR") },
    { label: t.statsBalance, value: formatPrice(overview.stats.balanceToman) },
    { label: t.statsLifetime, value: formatPrice(overview.stats.lifetimeCreditToman) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="panel-card rounded-heritage-lg p-4 text-center"
        >
          <p className="text-xs text-silver">{item.label}</p>
          <p className="mt-2 font-display text-lg font-semibold text-ivory">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function AddProductForm({
  isSaving,
  onCreate,
}: {
  isSaving: boolean;
  onCreate: (input: {
    id: string; name: string; namePersian: string; price: number;
    stock: number; image: string; headline?: string;
  }) => Promise<boolean>;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [namePersian, setNamePersian] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [image, setImage] = useState("/Picsart_26-04-26_15-15-33-128.jpg");
  const [headline, setHeadline] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t.addProduct}
      </Button>
    );
  }

  return (
    <form
      className="seller-product-form panel-card grid gap-3 p-5 md:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await onCreate({
          id,
          name,
          namePersian,
          price: Number(price),
          stock: Number(stock),
          image,
          headline,
        });
        if (ok) {
          setOpen(false);
          setId(""); setName(""); setNamePersian(""); setPrice(""); setHeadline("");
        }
      }}
    >
      <TextBox label={t.productId} value={id} onChange={(e) => setId(e.target.value)} inputClassName="auth-input-ltr" required />
      <TextBox label={t.productName} value={name} onChange={(e) => setName(e.target.value)} inputClassName="auth-input-ltr" required />
      <TextBox label={t.productNamePersian} value={namePersian} onChange={(e) => setNamePersian(e.target.value)} required />
      <TextBox label={t.price} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric" required />
      <TextBox label={t.stock} value={stock} onChange={(e) => setStock(e.target.value)} inputMode="numeric" />
      <TextBox label={t.image} value={image} onChange={(e) => setImage(e.target.value)} inputClassName="auth-input-ltr" />
      <TextBox label={t.headline} value={headline} onChange={(e) => setHeadline(e.target.value)} />
      <div className="flex items-end gap-2 md:col-span-2">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? t.creating : t.createProduct}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          انصراف
        </Button>
      </div>
    </form>
  );
}

function ProductRow({
  product,
  isSaving,
  onUpdate,
}: {
  product: { id: string; name: string; price: number; stock: number };
  isSaving: boolean;
  onUpdate: (id: string, patch: { price?: number; stock?: number }) => Promise<boolean>;
}) {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const dirty = Number(price) !== product.price || Number(stock) !== product.stock;

  return (
    <li className="seller-product-row flex flex-wrap items-center gap-3 rounded-heritage-lg border border-gold/10 bg-matte-elevated p-4">
      <div className="min-w-[10rem] flex-1">
        <Link href={`/product/${product.id}`} className="font-medium text-ivory hover:text-gold-dark">
          {product.name}
        </Link>
        <p className="mt-1 text-xs text-silver" dir="ltr">{product.id}</p>
      </div>
      <label className="flex items-center gap-2 text-xs text-silver">
        {t.editPrice}
        <input
          className="field-control field-control--sm w-36 text-sm"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          inputMode="numeric"
          dir="ltr"
        />
      </label>
      <label className="flex items-center gap-2 text-xs text-silver">
        {t.editStock}
        <input
          className="field-control field-control--sm w-24 text-sm"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          inputMode="numeric"
          dir="ltr"
        />
      </label>
      <Button
        type="button"
        size="sm"
        disabled={!dirty || isSaving}
        onClick={() =>
          void onUpdate(product.id, {
            ...(Number(price) !== product.price ? { price: Number(price) } : {}),
            ...(Number(stock) !== product.stock ? { stock: Number(stock) } : {}),
          })
        }
      >
        {t.save}
      </Button>
    </li>
  );
}

function PayoutsSection({
  balance,
  payouts,
  isSaving,
  onRequest,
}: {
  balance: number;
  payouts: ReturnType<typeof useSellerPanel>["payouts"];
  isSaving: boolean;
  onRequest: (amount: number, note?: string) => Promise<boolean>;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  return (
    <section className="seller-payouts space-y-4" aria-labelledby="seller-payouts-heading">
      <h2 id="seller-payouts-heading" className="font-display text-xl text-ivory">
        {t.payoutsTitle}
      </h2>
      <form
        className="flex flex-wrap items-end gap-3 rounded-heritage-lg border border-gold/10 bg-matte-elevated p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onRequest(Number(amount), note);
          if (ok) { setAmount(""); setNote(""); }
        }}
      >
        <TextBox label={t.payoutAmount} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" required />
        <TextBox label={t.payoutNote} value={note} onChange={(e) => setNote(e.target.value)} />
        <Button type="submit" disabled={isSaving || balance < 1_000_000}>
          {t.requestPayout}
        </Button>
      </form>

      {payouts.length === 0 ? (
        <p className="text-sm text-silver">{t.noPayouts}</p>
      ) : (
        <ul className="space-y-2">
          {payouts.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-heritage-lg border border-gold/10 bg-matte-elevated p-3 text-sm"
            >
              <span className="font-medium text-ivory">{formatPrice(p.amount)}</span>
              <span className="text-xs text-silver">
                {new Date(p.createdAt).toLocaleDateString("fa-IR")}
              </span>
              <Badge variant={p.status === "paid" ? "default" : p.status === "rejected" ? "default" : "gold"}>
                {t.payoutStatus[p.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function SellerPanel() {
  const panel = useSellerPanel();

  if (!panel.isLoggedIn) {
    return (
      <div className="py-16 text-center">
        <p className="text-ivory">{t.loginHint}</p>
        <Link href="/auth?redirect=/seller" className="mt-4 inline-block">
          <Button variant="outline">{fa.nav.loginOrRegister}</Button>
        </Link>
      </div>
    );
  }

  if (panel.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="sk sk-card h-24" />
        <div className="sk sk-card h-64" />
      </div>
    );
  }

  // No shop yet — registration form
  if (!panel.hasShop) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-6 text-center">
          <span className="heritage-eyebrow">{t.eyebrow}</span>
          <h1 className="admin-page-title">{t.registerTitle}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-silver">{t.registerSubtitle}</p>
        </header>
        <RegisterShopForm onSubmit={panel.registerShop} />
      </motion.div>
    );
  }

  const status = panel.shopStatus;
  const active = status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="heritage-eyebrow">{t.eyebrow}</span>
          <h1 className="admin-page-title">
            {panel.overview?.seller.shopName ?? t.title}
          </h1>
          <p className="mt-1 font-mono text-xs text-silver" dir="ltr">
            /{panel.overview?.seller.slug}
          </p>
        </div>
        <Badge variant={active ? "turquoise" : status === "suspended" ? "default" : "gold"}>
          {status === "active"
            ? fa.admin.sellers.status.active
            : status === "suspended"
              ? fa.admin.sellers.status.suspended
              : fa.admin.sellers.status.pending}
        </Badge>
      </header>

      {status === "pending" ? (
        <p className="rounded-heritage-lg border border-gold/30 bg-gold/5 p-4 text-sm text-gold-dark">
          {t.statusPending}
        </p>
      ) : null}
      {status === "suspended" ? (
        <p className="rounded-heritage-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {t.statusSuspended}
        </p>
      ) : null}

      {panel.overview ? <StatsCards overview={panel.overview} /> : null}

      {active ? (
        <>
          <section className="space-y-4" aria-labelledby="seller-products-heading">
            <div className="flex items-center justify-between">
              <h2 id="seller-products-heading" className="font-display text-xl text-ivory">
                {t.productsTitle}
              </h2>
              <AddProductForm isSaving={panel.isSaving} onCreate={panel.createProduct} />
            </div>
            {panel.products.length === 0 ? (
              <p className="rounded-heritage-lg border border-dashed border-[#E5E0DA] p-8 text-center text-sm text-silver">
                {t.emptyProducts}
              </p>
            ) : (
              <ul className="space-y-3">
                {panel.products.map((p) => (
                  <ProductRow
                    key={p.id}
                    product={{ id: p.id, name: p.name, price: p.price, stock: p.stock ?? 1 }}
                    isSaving={panel.isSaving}
                    onUpdate={panel.updateProduct}
                  />
                ))}
              </ul>
            )}
          </section>

          <PayoutsSection
            balance={panel.overview?.stats.balanceToman ?? 0}
            payouts={panel.payouts}
            isSaving={panel.isSaving}
            onRequest={panel.requestPayout}
          />
        </>
      ) : null}
    </motion.div>
  );
}
