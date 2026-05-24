"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SelectBox } from "@/components/inputs";
import { ADMIN_MEDIA_CATEGORIES, type AdminMediaCategory } from "@/lib/media/categories";
import { useAdminMedia } from "@/lib/hooks/useAdminMedia";

type AdminMediaPickerProps = {
  category: AdminMediaCategory;
  value?: string;
  label?: string;
  onPick: (url: string) => void;
};

function prettySize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function AdminMediaPicker({ category, value, label = "مدیریت رسانه", onPick }: AdminMediaPickerProps) {
  const media = useAdminMedia();
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<AdminMediaCategory>(category);

  useEffect(() => {
    if (open && media.isAdmin) {
      void media.load(activeCategory);
    }
  }, [open, media.isAdmin, media.load, activeCategory, media]);

  const options = useMemo(
    () => ADMIN_MEDIA_CATEGORIES.map((item) => ({ value: item.value, label: item.label })),
    []
  );

  return (
    <div className="admin-media-picker">
      <div className="admin-media-picker-head">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen((prev) => !prev)}>
          {open ? "بستن" : label}
        </Button>
        {value ? (
          <Button type="button" size="sm" variant="outline" onClick={() => onPick("")}>
            پاک‌کردن انتخاب
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="admin-media-picker-panel">
          <div className="admin-media-picker-toolbar">
            <SelectBox
              label="دسته‌بندی"
              value={activeCategory}
              options={options}
              onValueChange={(v) => setActiveCategory(v as AdminMediaCategory)}
            />
            <label className="admin-csv-upload-btn">
              آپلود فایل
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const uploaded = await media.upload(file, activeCategory);
                  if (uploaded) onPick(uploaded.webpUrl ?? uploaded.url);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </div>

          {media.isLoading ? (
            <p className="text-xs text-silver">در حال بارگذاری رسانه‌ها…</p>
          ) : (
            <div className="admin-media-grid">
              {media.assets.map((asset) => {
                const src = asset.webpUrl ?? asset.url;
                const selected = value === src || value === asset.url;
                return (
                  <article key={asset.id} className={`admin-media-card${selected ? " admin-media-card--selected" : ""}`}>
                    <button type="button" className="admin-media-thumb" onClick={() => onPick(src)}>
                      <Image src={src} alt={asset.originalName} fill className="object-cover" sizes="160px" />
                    </button>
                    <div className="admin-media-meta">
                      <p className="line-clamp-1">{asset.originalName}</p>
                      <p>{asset.width && asset.height ? `${asset.width}×${asset.height}` : "—"} · {prettySize(asset.sizeBytes)}</p>
                    </div>
                    <div className="admin-media-actions">
                      <Button type="button" size="sm" variant="outline" onClick={() => onPick(src)}>
                        انتخاب
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void media.remove(asset.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
