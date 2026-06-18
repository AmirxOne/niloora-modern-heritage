"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fa } from "@/lib/i18n/fa";
import { useAdminHomeContent } from "@/lib/hooks/useAdminHomeContent";
import { useAdminProducts } from "@/lib/hooks/useAdminProducts";
import type { HomeBannerDto } from "@/lib/types/home-content";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { Badge } from "@/components/ui/Badge";
import { AdminMediaPicker } from "@/components/admin/AdminMediaPicker";
import { AdminHomeKpiPanel } from "@/components/admin/AdminHomeKpiPanel";
import { LoadingState } from "@/components/ui/loading/LoadingState";

export function AdminHomeContentPanel() {
  const admin = useAdminHomeContent();
  const { isAdmin, loadAll } = admin;
  const products = useAdminProducts();
  const { loadProducts } = products;

  const [bannerForm, setBannerForm] = useState<HomeBannerDto | null>(null);
  const [sliderProductId, setSliderProductId] = useState("");
  const [sliderSort, setSliderSort] = useState("0");
  const [sliderBannerUrl, setSliderBannerUrl] = useState("");

  const [testimonialForm, setTestimonialForm] = useState({
    id: "" as string | undefined,
    name: "",
    location: "",
    text: "",
    rating: "5",
    sortOrder: "0",
  });

  const [instagramForm, setInstagramForm] = useState({
    id: "" as string | undefined,
    image: "",
    likes: "0",
    sortOrder: "0",
  });

  useEffect(() => {
    if (isAdmin) {
      void loadAll();
      void loadProducts();
    }
  }, [isAdmin, loadAll, loadProducts]);

  useEffect(() => {
    if (admin.banner) setBannerForm(admin.banner);
  }, [admin.banner]);

  if (!admin.allowed) return null;

  const resetTestimonialForm = () => {
    setTestimonialForm({
      id: undefined,
      name: "",
      location: "",
      text: "",
      rating: "5",
      sortOrder: "0",
    });
  };

  const resetInstagramForm = () => {
    setInstagramForm({ id: undefined, image: "", likes: "0", sortOrder: "0" });
  };

  return (
    <div className="admin-orders-panel space-y-8">
      <AdminHomeKpiPanel />
      <div className="admin-orders-toolbar">
        <Button
          type="button"
          variant="outline"
          disabled={admin.isLoading}
          onClick={() => void admin.loadAll()}
        >
          {fa.admin.home.refresh}
        </Button>
      </div>

      {admin.isLoading && !bannerForm ? (
        <LoadingState variant="admin-form" />
      ) : null}

      {/* Banner */}
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">{fa.admin.home.bannerTitle}</h2>
        <p className="mb-4 text-xs text-silver">{fa.admin.home.bannerHint}</p>
        {bannerForm ? (
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bannerForm.enabled}
                onChange={(e) => setBannerForm({ ...bannerForm, enabled: e.target.checked })}
              />
              {fa.admin.home.bannerEnabled}
            </label>
            <TextBox
              label={fa.admin.home.badge}
              value={bannerForm.badge}
              onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
            />
            <TextBox
              label={fa.admin.home.bannerHeadline}
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
            />
            <TextAreaBox
              label={fa.admin.home.bannerSubtitle}
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
              rows={2}
            />
            <TextBox
              label={fa.admin.home.percent}
              value={String(bannerForm.percent)}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, percent: Number(e.target.value.replace(/\D/g, "")) })
              }
              inputClassName="auth-input-ltr"
            />
            <TextBox
              label={fa.admin.home.ctaLabel}
              value={bannerForm.ctaLabel ?? ""}
              onChange={(e) => setBannerForm({ ...bannerForm, ctaLabel: e.target.value })}
            />
            <TextBox
              label={fa.admin.home.ctaHref}
              value={bannerForm.ctaHref}
              onChange={(e) => setBannerForm({ ...bannerForm, ctaHref: e.target.value })}
              inputClassName="auth-input-ltr"
            />
            <Button
              type="button"
              disabled={admin.isSaving}
              onClick={() => void admin.saveBanner(bannerForm)}
            >
              {fa.admin.home.save}
            </Button>
          </div>
        ) : null}
      </section>

      {/* Header strip */}
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">{fa.admin.home.headerStripTitle}</h2>
        <p className="mb-4 text-xs text-silver">{fa.admin.home.headerStripHint}</p>
        {bannerForm ? (
          <div className="grid gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={bannerForm.headerStripEnabled}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, headerStripEnabled: e.target.checked })
                }
              />
              {fa.admin.home.headerStripEnabled}
            </label>

            <fieldset className="grid gap-2">
              <legend className="mb-1 text-xs font-medium text-silver">
                {fa.admin.home.headerStripMode}
              </legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="headerStripMode"
                  checked={bannerForm.headerStripMode === "text"}
                  onChange={() => setBannerForm({ ...bannerForm, headerStripMode: "text" })}
                />
                {fa.admin.home.headerStripModeText}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="headerStripMode"
                  checked={bannerForm.headerStripMode === "image"}
                  onChange={() => setBannerForm({ ...bannerForm, headerStripMode: "image" })}
                />
                {fa.admin.home.headerStripModeImage}
              </label>
            </fieldset>

            {bannerForm.headerStripMode === "image" ? (
              <>
                <TextBox
                  label={fa.admin.home.headerStripImageUrl}
                  value={bannerForm.headerStripImageUrl ?? ""}
                  onChange={(e) =>
                    setBannerForm({
                      ...bannerForm,
                      headerStripImageUrl: e.target.value || null,
                    })
                  }
                  inputClassName="auth-input-ltr"
                />
                <AdminMediaPicker
                  category="home"
                  value={bannerForm.headerStripImageUrl ?? undefined}
                  label={fa.admin.home.headerStripImageUrl}
                  onPick={(url) => setBannerForm({ ...bannerForm, headerStripImageUrl: url })}
                />
                {bannerForm.headerStripImageUrl ? (
                  <div className="relative h-16 w-full max-w-xl overflow-hidden rounded-lg border border-gold/15">
                    <Image
                      src={bannerForm.headerStripImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="640px"
                    />
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <TextBox
                  label={fa.admin.home.headerStripBadge}
                  value={bannerForm.headerStripBadge}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, headerStripBadge: e.target.value })
                  }
                />
                <TextBox
                  label={fa.admin.home.headerStripHeadline}
                  value={bannerForm.headerStripTitle}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, headerStripTitle: e.target.value })
                  }
                />
                <TextAreaBox
                  label={fa.admin.home.headerStripSubtitle}
                  value={bannerForm.headerStripSubtitle}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, headerStripSubtitle: e.target.value })
                  }
                  rows={2}
                />
                <TextBox
                  label={fa.admin.home.headerStripCtaLabel}
                  value={bannerForm.headerStripCtaLabel ?? ""}
                  onChange={(e) =>
                    setBannerForm({ ...bannerForm, headerStripCtaLabel: e.target.value })
                  }
                />
              </>
            )}

            <TextBox
              label={fa.admin.home.headerStripCtaHref}
              value={bannerForm.headerStripCtaHref}
              onChange={(e) =>
                setBannerForm({ ...bannerForm, headerStripCtaHref: e.target.value })
              }
              inputClassName="auth-input-ltr"
            />

            <Button
              type="button"
              disabled={admin.isSaving}
              onClick={() => void admin.saveBanner(bannerForm)}
            >
              {fa.admin.home.save}
            </Button>
          </div>
        ) : null}
      </section>

      {/* Slider */}
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">{fa.admin.home.sliderTitle}</h2>
        <p className="mb-2 text-xs text-silver">{fa.admin.home.sliderHint}</p>
        <p className="mb-4 rounded-lg border border-gold/15 bg-parchment/40 px-3 py-2 text-xs leading-relaxed text-silver">
          {fa.admin.home.sliderBannerHint}
        </p>
        <div className="mb-4 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <TextBox
              label={fa.admin.home.productId}
              value={sliderProductId}
              onChange={(e) => setSliderProductId(e.target.value)}
              inputClassName="auth-input-ltr min-w-[12rem]"
            />
            <TextBox
              label={fa.admin.home.sortOrder}
              value={sliderSort}
              onChange={(e) => setSliderSort(e.target.value)}
              inputClassName="auth-input-ltr w-24"
            />
          </div>
          <AdminMediaPicker
            category="home"
            label={fa.admin.home.sliderBannerImage}
            value={sliderBannerUrl}
            onPick={setSliderBannerUrl}
          />
          {sliderBannerUrl ? (
            <span className="relative block h-20 w-full max-w-md overflow-hidden rounded-md border border-gold/15">
              <Image
                src={sliderBannerUrl}
                alt=""
                fill
                className="object-cover object-center"
                sizes="400px"
              />
            </span>
          ) : null}
          <Button
            type="button"
            disabled={admin.isSaving || !sliderProductId.trim()}
            onClick={() =>
              void admin.addSliderItem({
                productId: sliderProductId.trim(),
                bannerImageUrl: sliderBannerUrl.trim() || null,
                sortOrder: Number(sliderSort) || 0,
                active: true,
              }).then((ok) => {
                if (ok) {
                  setSliderProductId("");
                  setSliderSort("0");
                  setSliderBannerUrl("");
                }
              })
            }
          >
            {fa.admin.home.addSlider}
          </Button>
        </div>
        {admin.sliderItems.length === 0 ? (
          <p className="text-sm text-silver">{fa.admin.home.sliderEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {admin.sliderItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-lg border border-gold/15 p-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  {(item.bannerImageUrl || item.productImage) ? (
                    <span className="relative h-14 w-28 shrink-0 overflow-hidden rounded-md border border-gold/10">
                      <Image
                        src={item.bannerImageUrl || item.productImage || ""}
                        alt=""
                        fill
                        className="object-cover object-center"
                        sizes="112px"
                      />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs" dir="ltr">
                      {item.productId}
                    </p>
                    <p className="text-sm text-ivory">{item.productName}</p>
                  </div>
                  <Badge variant={item.active ? "turquoise" : "default"}>
                    {item.active ? fa.admin.promoCodes.active : fa.admin.promoCodes.inactive}
                  </Badge>
                  <TextBox
                    label={fa.admin.home.sortOrder}
                    value={String(item.sortOrder)}
                    onChange={(e) =>
                      void admin.updateSliderItem(item.id, {
                        sortOrder: Number(e.target.value) || 0,
                      })
                    }
                    inputClassName="auth-input-ltr w-20"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void admin.updateSliderItem(item.id, { active: !item.active })
                    }
                  >
                    {item.active ? fa.admin.home.deactivate : fa.admin.home.activate}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void admin.deleteSliderItem(item.id)}
                  >
                    {fa.admin.home.delete}
                  </Button>
                </div>
                <AdminMediaPicker
                  category="home"
                  label={fa.admin.home.sliderBannerImage}
                  value={item.bannerImageUrl ?? ""}
                  onPick={(url) =>
                    void admin.updateSliderItem(item.id, { bannerImageUrl: url || null })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Testimonials */}
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">{fa.admin.home.testimonialsTitle}</h2>
        <div className="mb-4 grid gap-3">
          <TextBox
            label={fa.admin.home.name}
            value={testimonialForm.name}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
          />
          <TextBox
            label={fa.admin.home.location}
            value={testimonialForm.location}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, location: e.target.value })}
          />
          <TextAreaBox
            label={fa.admin.home.text}
            value={testimonialForm.text}
            onChange={(e) => setTestimonialForm({ ...testimonialForm, text: e.target.value })}
            rows={3}
          />
          <div className="flex flex-wrap gap-3">
            <TextBox
              label={fa.admin.home.rating}
              value={testimonialForm.rating}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })}
              inputClassName="auth-input-ltr w-20"
            />
            <TextBox
              label={fa.admin.home.sortOrder}
              value={testimonialForm.sortOrder}
              onChange={(e) => setTestimonialForm({ ...testimonialForm, sortOrder: e.target.value })}
              inputClassName="auth-input-ltr w-20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={admin.isSaving}
              onClick={() =>
                void admin
                  .saveTestimonial({
                    id: testimonialForm.id,
                    name: testimonialForm.name,
                    location: testimonialForm.location,
                    text: testimonialForm.text,
                    rating: Number(testimonialForm.rating) || 5,
                    sortOrder: Number(testimonialForm.sortOrder) || 0,
                  })
                  .then((ok) => ok && resetTestimonialForm())
              }
            >
              {testimonialForm.id ? fa.admin.home.save : fa.admin.home.addTestimonial}
            </Button>
            {testimonialForm.id ? (
              <Button type="button" variant="outline" onClick={resetTestimonialForm}>
                {fa.admin.promoCodes.cancel}
              </Button>
            ) : null}
          </div>
        </div>
        <ul className="space-y-2">
          {admin.testimonials.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-gold/10 p-3 text-sm"
            >
              <div>
                <p className="font-medium text-ivory">
                  {t.name} · {t.location}
                </p>
                <p className="mt-1 text-silver line-clamp-2">{t.text}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setTestimonialForm({
                      id: t.id,
                      name: t.name,
                      location: t.location,
                      text: t.text,
                      rating: String(t.rating),
                      sortOrder: String(t.sortOrder),
                    })
                  }
                >
                  {fa.admin.home.edit}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(fa.admin.home.deleteConfirm)) {
                      void admin.deleteTestimonial(t.id);
                    }
                  }}
                >
                  {fa.admin.home.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Instagram */}
      <section className="admin-order-card">
        <h2 className="admin-page-title text-lg">{fa.admin.home.instagramTitle}</h2>
        <div className="mb-4 grid gap-3">
          <TextBox
            label={fa.admin.home.imageUrl}
            value={instagramForm.image}
            onChange={(e) => setInstagramForm({ ...instagramForm, image: e.target.value })}
            inputClassName="auth-input-ltr"
          />
          <AdminMediaPicker
            category="home"
            value={instagramForm.image || undefined}
            label="مدیریت رسانه خانه"
            onPick={(url) => setInstagramForm({ ...instagramForm, image: url })}
          />
          <div className="flex flex-wrap gap-3">
            <TextBox
              label={fa.admin.home.likes}
              value={instagramForm.likes}
              onChange={(e) => setInstagramForm({ ...instagramForm, likes: e.target.value })}
              inputClassName="auth-input-ltr w-28"
            />
            <TextBox
              label={fa.admin.home.sortOrder}
              value={instagramForm.sortOrder}
              onChange={(e) => setInstagramForm({ ...instagramForm, sortOrder: e.target.value })}
              inputClassName="auth-input-ltr w-20"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={admin.isSaving}
              onClick={() =>
                void admin
                  .saveInstagramPost({
                    id: instagramForm.id,
                    image: instagramForm.image,
                    likes: Number(instagramForm.likes) || 0,
                    sortOrder: Number(instagramForm.sortOrder) || 0,
                  })
                  .then((ok) => ok && resetInstagramForm())
              }
            >
              {instagramForm.id ? fa.admin.home.save : fa.admin.home.addInstagram}
            </Button>
            {instagramForm.id ? (
              <Button type="button" variant="outline" onClick={resetInstagramForm}>
                {fa.admin.promoCodes.cancel}
              </Button>
            ) : null}
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {admin.instagramPosts.map((post) => (
            <li key={post.id} className="rounded-lg border border-gold/10 p-2">
              <div className="relative mb-2 aspect-square overflow-hidden rounded-md">
                <Image src={post.image} alt="" fill className="object-cover" sizes="200px" />
              </div>
              <p className="text-xs text-silver">
                {post.likes.toLocaleString("fa-IR")} {fa.admin.home.likes}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setInstagramForm({
                      id: post.id,
                      image: post.image,
                      likes: String(post.likes),
                      sortOrder: String(post.sortOrder),
                    })
                  }
                >
                  {fa.admin.home.edit}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm(fa.admin.home.deleteConfirm)) {
                      void admin.deleteInstagramPost(post.id);
                    }
                  }}
                >
                  {fa.admin.home.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
