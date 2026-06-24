"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import {
  VENDOR_PRODUCT_CATEGORIES,
  VENDOR_PRODUCT_METALS,
  VENDOR_PRODUCT_STONES,
} from "@/lib/vendor/product-form-options";
import type { Product } from "@/lib/types";
import type { MetalType, RingStyle, StoneType } from "@/lib/types";

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
        />
        <Field
          label={fa.vendor.productStock}
          value={form.stock}
          onChange={(v) => update("stock", v)}
          type="number"
          dir="ltr"
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
      <Field
        label={fa.vendor.productImage}
        value={form.image}
        onChange={(v) => update("image", v)}
        required
        dir="ltr"
      />
      <Field
        label={fa.vendor.productHeadline}
        value={form.listingHeadline}
        onChange={(v) => update("listingHeadline", v)}
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={loading}>
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  dir?: "ltr" | "rtl";
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
