"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import {
  VENDOR_PRODUCT_CATEGORIES,
  VENDOR_PRODUCT_METALS,
  VENDOR_PRODUCT_STONES,
} from "@/lib/vendor/product-form-options";
import type { Product } from "@/lib/types";
import type { MetalType, RingStyle, StoneType } from "@/lib/types";
import {
  VENDOR_PRODUCT_PRICE_MAX,
  VENDOR_PRODUCT_PRICE_MIN,
  VENDOR_PRODUCT_STOCK_MAX,
  VENDOR_PRODUCT_STOCK_MIN,
} from "@/lib/vendor/vendor-product-validation";

export type VendorProductFormValues = {
  name: string;
  namePersian: string;
  price: string;
  image: string;
  stock: string;
  category: RingStyle;
  metal: MetalType;
  stone: StoneType;
  listingHeadline: string;
};

const emptyForm = (): VendorProductFormValues => ({
  name: "",
  namePersian: "",
  price: "",
  image: "",
  stock: "1",
  category: "signet",
  metal: "sterling",
  stone: "turquoise",
  listingHeadline: "",
});

export function productToFormValues(product: Product): VendorProductFormValues {
  return {
    name: product.name,
    namePersian: product.namePersian,
    price: String(product.price),
    image: product.image,
    stock: String(product.stock ?? 1),
    category: product.category,
    metal: product.metal,
    stone: product.stone,
    listingHeadline: product.listing?.headline ?? product.namePersian,
  };
}

type Props = {
  mode: "create" | "edit";
  initial?: VendorProductFormValues;
  onCancel: () => void;
  onSaved: () => void;
  productId?: string;
};

export function VendorProductForm({ mode, initial, onCancel, onSaved, productId }: Props) {
  const [form, setForm] = useState<VendorProductFormValues>(initial ?? emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const update = <K extends keyof VendorProductFormValues>(key: K, value: VendorProductFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      name: form.name.trim(),
      namePersian: form.namePersian.trim(),
      price: Number(form.price),
      image: form.image.trim(),
      stock: Number(form.stock) || 1,
      category: form.category,
      metal: form.metal,
      stone: form.stone,
      listingHeadline: form.listingHeadline.trim() || form.namePersian.trim(),
    };
    try {
      const url =
        mode === "create" ? "/api/vendor/products" : `/api/vendor/products/${productId}`;
      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? fa.vendor.errorGeneric);
        return;
      }
      onSaved();
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const uploadSelectedImage = async () => {
    if (!selectedImage) {
      setUploadError("ابتدا فایل تصویر را انتخاب کنید.");
      return;
    }
    setUploadError(null);
    setUploadSuccess(null);
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.set("file", selectedImage);
      const res = await fetch("/api/vendor/media", {
        method: "POST",
        credentials: "include",
        body,
      });
      const data = (await res.json()) as {
        message?: string;
        asset?: { canonicalUrl?: string; url?: string };
      };
      if (!res.ok) {
        setUploadError(data.message ?? fa.vendor.errorGeneric);
        return;
      }
      const uploadedUrl = data.asset?.canonicalUrl ?? data.asset?.url;
      if (!uploadedUrl) {
        setUploadError("پاسخ آپلود تصویر معتبر نبود.");
        return;
      }
      update("image", uploadedUrl);
      setUploadSuccess("تصویر با موفقیت آپلود شد.");
      setSelectedImage(null);
    } catch {
      setUploadError(fa.vendor.errorGeneric);
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-heritage border border-subtle bg-matte-elevated p-6"
    >
      <h2 className="text-lg font-semibold text-ivory">
        {mode === "create" ? fa.vendor.productFormTitleNew : fa.vendor.productFormTitleEdit}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={fa.vendor.productName}
          value={form.name}
          onChange={(v) => update("name", v)}
          required
        />
        <Field
          label={fa.vendor.productNamePersian}
          value={form.namePersian}
          onChange={(v) => update("namePersian", v)}
          required
        />
        <Field
          label={fa.vendor.productPrice}
          value={form.price}
          onChange={(v) => update("price", v)}
          required
          type="number"
          dir="ltr"
          min={VENDOR_PRODUCT_PRICE_MIN}
          max={VENDOR_PRODUCT_PRICE_MAX}
          step={1}
        />
        <Field
          label={fa.vendor.productStock}
          value={form.stock}
          onChange={(v) => update("stock", v)}
          type="number"
          dir="ltr"
          required
          min={VENDOR_PRODUCT_STOCK_MIN}
          max={VENDOR_PRODUCT_STOCK_MAX}
          step={1}
        />
        <SelectField
          label={fa.vendor.productCategory}
          value={form.category}
          onChange={(v) => update("category", v as RingStyle)}
          options={VENDOR_PRODUCT_CATEGORIES.map((value) => ({
            value,
            label: fa.shop.styles[value] ?? value,
          }))}
        />
        <SelectField
          label={fa.vendor.productMetal}
          value={form.metal}
          onChange={(v) => update("metal", v as MetalType)}
          options={VENDOR_PRODUCT_METALS.map((value) => ({
            value,
            label: fa.metals[value] ?? value,
          }))}
        />
        <SelectField
          label={fa.vendor.productStone}
          value={form.stone}
          onChange={(v) => update("stone", v as StoneType)}
          options={VENDOR_PRODUCT_STONES.map((value) => ({
            value,
            label: fa.stones[value] ?? value,
          }))}
        />
      </div>
      <div className="space-y-3 rounded-heritage border border-subtle bg-white/40 p-4">
        <label className="mb-1 block text-sm text-silver">{fa.vendor.productImage}</label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0] ?? null;
              setSelectedImage(file);
              setUploadError(null);
              setUploadSuccess(null);
            }}
            className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
          />
          <Button
            type="button"
            isLoading={uploadingImage}
            onClick={uploadSelectedImage}
            disabled={!selectedImage || loading}
          >
            آپلود تصویر
          </Button>
        </div>
        {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
        {uploadSuccess ? <p className="text-sm text-emerald-700">{uploadSuccess}</p> : null}
        <Field
          label="لینک نهایی تصویر"
          value={form.image}
          onChange={(v) => update("image", v)}
          required
          dir="ltr"
        />
        {form.image ? (
          <div className="overflow-hidden rounded-heritage border border-subtle bg-white p-2">
            <Image
              src={form.image}
              alt={form.namePersian || form.name || "تصویر محصول"}
              width={320}
              height={160}
              className="h-40 w-auto rounded-md object-cover"
            />
          </div>
        ) : null}
      </div>
      <Field
        label={fa.vendor.productHeadline}
        value={form.listingHeadline}
        onChange={(v) => update("listingHeadline", v)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={loading} disabled={uploadingImage}>
          {fa.vendor.productSave}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {fa.vendor.productCancel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  dir,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  dir?: "ltr" | "rtl";
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-silver">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        min={min}
        max={max}
        step={step}
        className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-silver">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
