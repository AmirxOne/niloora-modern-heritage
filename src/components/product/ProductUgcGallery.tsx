"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { UnifiedEmptyState } from "@/components/ui/UnifiedEmptyState";
import { useProductUgc } from "@/lib/hooks/useProductUgc";
import type { Product } from "@/lib/types";
import { fa } from "@/lib/i18n/fa";

export function ProductUgcGallery({ product }: { product: Product }) {
  const { items, isLoading, submit } = useProductUgc(product.id);
  const [mediaUrl, setMediaUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [orderId, setOrderId] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = mediaUrl.trim();
    if (!url) {
      toast.error("لینک عکس یا ویدیو را وارد کنید.");
      return;
    }
    setIsSubmitting(true);
    try {
      const ok = await submit({
        productId: product.id,
        mediaUrl: url,
        mediaType,
        caption: caption.trim() || undefined,
        orderId: orderId.trim() || undefined,
      });
      if (!ok) {
        toast.error("ثبت محتوا انجام نشد. ابتدا وارد حساب شوید یا اطلاعات سفارش را بررسی کنید.");
        return;
      }
      toast.success("محتوا ثبت شد و پس از تایید ادمین در صفحه محصول نمایش داده می‌شود.");
      setMediaUrl("");
      setCaption("");
      setOrderId("");
      setMediaType("image");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="product-ugc" aria-labelledby="product-ugc-title">
      <header className="product-ugc-head">
        <h2 id="product-ugc-title" className="product-ugc-title">
          {fa.product.ugc.title}
        </h2>
        <p className="product-ugc-subtitle">{fa.product.ugc.subtitle}</p>
      </header>

      <div className="product-ugc-layout">
        <aside className="product-ugc-form-card">
          <h3 className="product-ugc-form-title">{fa.product.ugc.formTitle}</h3>
          <p className="product-ugc-form-hint">{fa.product.ugc.formHint}</p>
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="product-ugc-type-row">
              <button
                type="button"
                className={`product-ugc-type-btn ${mediaType === "image" ? "product-ugc-type-btn--active" : ""}`}
                onClick={() => setMediaType("image")}
              >
                {fa.product.ugc.typeImage}
              </button>
              <button
                type="button"
                className={`product-ugc-type-btn ${mediaType === "video" ? "product-ugc-type-btn--active" : ""}`}
                onClick={() => setMediaType("video")}
              >
                {fa.product.ugc.typeVideo}
              </button>
            </div>
            <TextBox
              label={fa.product.ugc.mediaUrlLabel}
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={fa.product.ugc.mediaUrlPlaceholder}
              inputClassName="auth-input-ltr"
            />
            <TextBox
              label={fa.product.ugc.orderIdLabel}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder={fa.product.ugc.orderIdPlaceholder}
              inputClassName="auth-input-ltr"
            />
            <TextAreaBox
              id="ugc-caption"
              label={fa.product.ugc.captionLabel}
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 280))}
              placeholder={fa.product.ugc.captionPlaceholder}
              maxLength={280}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? fa.product.ugc.submitting : fa.product.ugc.submit}
            </Button>
          </form>
        </aside>

        <div className="product-ugc-list-wrap">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="product-ugc-card">
                  <div className="sk aspect-square w-full rounded-xl" />
                  <div className="sk mt-3 h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <UnifiedEmptyState
              visual="shop"
              title={fa.product.ugc.emptyTitle}
              description={fa.product.ugc.emptyHint}
              className="product-ugc-empty"
            />
          ) : (
            <ul className="product-ugc-grid">
              {items.map((item) => (
                <li key={item.id} className="product-ugc-card">
                  {item.mediaType === "image" ? (
                    <div className="product-ugc-media">
                      <Image src={item.mediaUrl} alt={item.caption ?? ""} fill className="object-cover" sizes="(max-width: 768px) 100vw, 320px" />
                    </div>
                  ) : (
                    <div className="product-ugc-media product-ugc-media--video">
                      <video src={item.mediaUrl} controls playsInline preload="metadata" />
                    </div>
                  )}
                  {item.caption ? <p className="product-ugc-caption">{item.caption}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
