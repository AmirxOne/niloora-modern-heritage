"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useAdminUgcModeration } from "@/lib/hooks/useProductUgc";
import { fa } from "@/lib/i18n/fa";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UgcModeration() {
  const moderation = useAdminUgcModeration();

  const handleApprove = async (id: string) => {
    const ok = await moderation.approve(id);
    if (ok) toast.success("UGC تایید شد و منتشر شد.");
    else toast.error("تایید UGC انجام نشد.");
  };

  const handleReject = async (id: string) => {
    const ok = await moderation.reject(id);
    if (ok) toast.success("UGC رد شد.");
    else toast.error("رد UGC انجام نشد.");
  };

  return (
    <div className="comment-moderation">
      <div className="comment-moderation-header">
        <div>
          <h2 className="font-display text-2xl text-ivory md:text-3xl">{fa.product.ugc.adminTitle}</h2>
          <p className="mt-2 text-sm text-silver">{fa.product.ugc.adminSubtitle}</p>
          {moderation.pendingItems.length > 0 ? (
            <p className="mt-2 text-xs font-medium text-gold-dark">
              {fa.product.ugc.adminPending(moderation.pendingItems.length)}
            </p>
          ) : null}
        </div>
      </div>

      {moderation.isLoading ? (
        <div className="comment-moderation-list space-y-4" aria-busy="true">
          {Array.from({ length: 3 }).map((_, idx) => (
            <article key={idx} className="comment-moderation-card">
              <div className="sk h-4 w-44" />
              <div className="sk mt-3 h-48 w-full rounded-xl" />
            </article>
          ))}
        </div>
      ) : !moderation.canModerate ? (
        <div className="comment-moderation-empty">
          <p className="text-silver">{fa.dashboard.commentModerationForbidden}</p>
        </div>
      ) : moderation.pendingItems.length === 0 ? (
        <div className="comment-moderation-empty">
          <p className="text-silver">{fa.product.ugc.adminEmpty}</p>
        </div>
      ) : (
        <div className="comment-moderation-list">
          {moderation.pendingItems.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.35 }}
              className="comment-moderation-card"
            >
              <div className="comment-moderation-card-top">
                <div>
                  <p className="comment-moderation-meta">
                    {fa.dashboard.commentOnProduct}{" "}
                    <Link href={`/product/${item.productId}`} className="comment-moderation-product-link">
                      {item.productNamePersian || item.productName || item.productId}
                    </Link>
                  </p>
                  <p className="comment-moderation-author">
                    {(item.userName || "کاربر")} · {item.userPhone || "—"}
                  </p>
                  <p className="comment-moderation-date">{formatDate(item.createdAt)}</p>
                </div>
              </div>

              {item.mediaType === "image" ? (
                <div className="product-ugc-media mt-3">
                  <Image src={item.mediaUrl} alt={item.caption ?? ""} fill className="object-cover" sizes="(max-width:768px) 100vw, 400px" />
                </div>
              ) : (
                <div className="product-ugc-media product-ugc-media--video mt-3">
                  <video src={item.mediaUrl} controls playsInline preload="metadata" />
                </div>
              )}
              {item.caption ? <p className="comment-moderation-body mt-3">{item.caption}</p> : null}
              <div className="comment-moderation-actions">
                <Button type="button" size="sm" onClick={() => void handleApprove(item.id)}>
                  {fa.dashboard.commentApprove}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void handleReject(item.id)}>
                  {fa.dashboard.commentReject}
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  );
}
