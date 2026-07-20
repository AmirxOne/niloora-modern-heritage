"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fa } from "@/lib/i18n/fa";
import type { VendorProfileDto } from "@/lib/types/vendor";

type Props = {
  vendor: VendorProfileDto;
  onSaved: () => Promise<void> | void;
};

type UploadTarget = "profileImageUrl" | "bannerImageUrl";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export function VendorStorefrontBrandingForm({ vendor, onSaved }: Props) {
  const [profileImageUrl, setProfileImageUrl] = useState(vendor.profileImageUrl ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(vendor.bannerImageUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<UploadTarget | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const uploadImage = async (file: File, target: UploadTarget) => {
    setError(null);
    setSuccess(null);
    setUploadingTarget(target);
    try {
      const body = new FormData();
      body.set("file", file);
      const response = await fetch("/api/vendor/media", {
        method: "POST",
        credentials: "include",
        body,
      });
      const payload = (await response.json()) as {
        message?: string;
        asset?: { canonicalUrl?: string; url?: string };
      };
      if (!response.ok) {
        setError(payload.message ?? fa.vendor.errorGeneric);
        return;
      }
      const imageUrl = payload.asset?.canonicalUrl ?? payload.asset?.url;
      if (!imageUrl) {
        setError(fa.vendor.errorGeneric);
        return;
      }
      if (target === "profileImageUrl") setProfileImageUrl(imageUrl);
      else setBannerImageUrl(imageUrl);
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setUploadingTarget(null);
    }
  };

  const save = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const response = await fetch("/api/vendor/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileImageUrl: profileImageUrl.trim() || null,
          bannerImageUrl: bannerImageUrl.trim() || null,
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        setError(payload.message ?? fa.vendor.errorGeneric);
        return;
      }
      setSuccess(fa.vendor.brandingSaveSuccess);
      await onSaved();
    } catch {
      setError(fa.vendor.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-ivory">{fa.vendor.brandingBannerImage}</p>
        <div className="overflow-hidden rounded-heritage border border-subtle bg-matte">
          {bannerImageUrl ? (
            <Image
              src={bannerImageUrl}
              alt={fa.vendor.brandingBannerPreviewAlt}
              width={1200}
              height={360}
              className="h-40 w-full object-cover md:h-52"
            />
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-l from-[#f4e2a5] to-[#f9f5e8] text-sm text-silver md:h-52">
              {fa.vendor.brandingBannerImage}
            </div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-heritage border border-subtle bg-white px-4 py-2 text-sm text-silver hover:bg-matte">
          {fa.vendor.brandingUploadImage}
          <input
            type="file"
            hidden
            accept={IMAGE_ACCEPT}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              void uploadImage(file, "bannerImageUrl");
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ivory">{fa.vendor.brandingProfileImage}</p>
        <div className="flex items-center gap-3">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-subtle bg-matte">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={fa.vendor.brandingProfilePreviewAlt}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-silver">
                {fa.vendor.brandingProfileImage}
              </div>
            )}
          </div>
          <label className="inline-flex cursor-pointer items-center rounded-heritage border border-subtle bg-white px-4 py-2 text-sm text-silver hover:bg-matte">
            {fa.vendor.brandingUploadImage}
            <input
              type="file"
              hidden
              accept={IMAGE_ACCEPT}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                void uploadImage(file, "profileImageUrl");
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {uploadingTarget ? <p className="text-sm text-silver">در حال آپلود…</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

      <Button type="button" isLoading={loading} onClick={save} disabled={Boolean(uploadingTarget)}>
        {fa.vendor.brandingSave}
      </Button>
    </div>
  );
}
