"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { SelectBox } from "@/components/inputs";
import { ADMIN_MEDIA_CATEGORIES, type AdminMediaCategory } from "@/lib/media/categories";
import { useAdminMedia, type AdminMediaAsset } from "@/lib/hooks/useAdminMedia";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import { fa } from "@/lib/i18n/fa";

const t = fa.admin.media;

type CategoryFilter = "all" | AdminMediaCategory;

function prettySize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatUploadedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminMediaPagePanel() {
  const media = useAdminMedia();
  const { allowed, isAdmin, assets, isLoading, isSaving, load, upload, remove } = media;
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const activeUploadCategory: AdminMediaCategory =
    categoryFilter === "all" ? "general" : categoryFilter;

  const reload = useCallback(() => {
    void load(categoryFilter === "all" ? undefined : categoryFilter);
  }, [categoryFilter, load]);

  useEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin, reload]);

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: t.categoryAll },
      ...ADMIN_MEDIA_CATEGORIES.map((item) => ({
        value: item.value,
        label: t.categories[item.value],
      })),
    ],
    []
  );

  const copyToClipboard = useCallback(async (value: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error(t.copyFailed);
    }
  }, []);

  const handleUpload = async (file: File) => {
    const uploaded = await upload(file, activeUploadCategory);
    if (uploaded && categoryFilter !== "all" && uploaded.category !== categoryFilter) {
      reload();
    }
  };

  const handleDelete = async (asset: AdminMediaAsset) => {
    if (!window.confirm(t.deleteConfirm)) return;
    await remove(asset.id);
  };

  if (!allowed) return null;

  return (
    <div className="admin-media-page">
      <div className="admin-orders-toolbar flex-wrap">
        <SelectBox
          label={t.categoryLabel}
          value={categoryFilter}
          options={categoryOptions}
          onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
        />
        <label className="admin-file-upload-btn">
          {isSaving ? t.uploading : t.upload}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={isSaving}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              await handleUpload(file);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <Button type="button" variant="outline" disabled={isLoading || isSaving} onClick={reload}>
          {t.refresh}
        </Button>
        {!isLoading ? (
          <p className="self-center text-xs text-silver">{t.fileCount(assets.length)}</p>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingState variant="media-grid" count={9} className="py-4" label={t.loading} />
      ) : assets.length === 0 ? (
        <UnifiedEmptyState title={t.empty} visual="shop" />
      ) : (
        <div className="admin-media-grid">
          {assets.map((asset) => {
            const previewSrc = asset.webpUrl ?? asset.url;
            const dimensions =
              asset.width && asset.height
                ? t.dimensions(asset.width, asset.height)
                : t.noDimensions;

            return (
              <article key={asset.id} className="admin-media-card">
                <div className="admin-media-thumb">
                  <Image
                    src={previewSrc}
                    alt={asset.originalName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 240px"
                  />
                </div>
                <div className="admin-media-meta">
                  <p className="line-clamp-1 font-medium text-ivory">{asset.originalName}</p>
                  <p>
                    {t.categories[asset.category]} · {dimensions} · {prettySize(asset.sizeBytes)}
                  </p>
                  <p>{formatUploadedAt(asset.createdAt)}</p>
                </div>
                <div className="admin-media-url-list">
                  <div className="admin-media-url-row">
                    <span className="admin-media-url-label">{t.urlLabel}</span>
                    <code className="admin-media-url" dir="ltr" title={asset.url}>
                      {asset.url}
                    </code>
                  </div>
                  {asset.webpUrl ? (
                    <div className="admin-media-url-row">
                      <span className="admin-media-url-label">{t.webpUrlLabel}</span>
                      <code className="admin-media-url" dir="ltr" title={asset.webpUrl}>
                        {asset.webpUrl}
                      </code>
                    </div>
                  ) : null}
                </div>
                <div className="admin-media-actions">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyToClipboard(asset.url, t.copiedUrl)}
                  >
                    {t.copyUrl}
                  </Button>
                  {asset.webpUrl ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void copyToClipboard(asset.webpUrl!, t.copiedWebpUrl)}
                    >
                      {t.copyWebpUrl}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isSaving}
                    onClick={() => void handleDelete(asset)}
                  >
                    {t.delete}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
