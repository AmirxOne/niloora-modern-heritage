"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";

type FormState = {
  displayName: string;
  displayNameFa: string;
  description: string;
  contactPhone: string;
  contactEmail: string;
  slug: string;
};

const initial: FormState = {
  displayName: "",
  displayNameFa: "",
  description: "",
  contactPhone: "",
  contactEmail: "",
  slug: "",
};

export function VendorApplyForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: form.displayName,
          displayNameFa: form.displayNameFa || undefined,
          description: form.description || undefined,
          contactPhone: form.contactPhone || undefined,
          contactEmail: form.contactEmail || undefined,
          slug: form.slug || undefined,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? fa.vendor.errorGeneric);
        return;
      }
      router.push("/vendor/dashboard");
      router.refresh();
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-5">
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="displayName">
          {fa.vendor.applyDisplayName} *
        </label>
        <input
          id="displayName"
          required
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="displayNameFa">
          {fa.vendor.applyDisplayNameFa}
        </label>
        <input
          id="displayNameFa"
          value={form.displayNameFa}
          onChange={(e) => update("displayNameFa", e.target.value)}
          className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="description">
          {fa.vendor.applyDescription}
        </label>
        <textarea
          id="description"
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="contactPhone">
            {fa.vendor.applyContactPhone}
          </label>
          <input
            id="contactPhone"
            type="tel"
            value={form.contactPhone}
            onChange={(e) => update("contactPhone", e.target.value)}
            className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
            dir="ltr"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="contactEmail">
            {fa.vendor.applyContactEmail}
          </label>
          <input
            id="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={(e) => update("contactEmail", e.target.value)}
            className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
            dir="ltr"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-silver" htmlFor="slug">
          {fa.vendor.applySlug}
        </label>
        <input
          id="slug"
          value={form.slug}
          onChange={(e) => update("slug", e.target.value)}
          className="w-full rounded-heritage border border-subtle bg-white px-4 py-3 text-sm"
          dir="ltr"
          placeholder="my-atelier"
        />
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Button type="submit" isLoading={loading} className="w-full sm:w-auto">
        {fa.vendor.applySubmit}
      </Button>
    </form>
  );
}
