"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import type {
  HomeBannerDto,
  HomeInstagramPostDto,
  HomeSliderItemDto,
  HomeTestimonialDto,
} from "@/lib/types/home-content";
import { useAuth } from "./useAuth";
import { parseJsonResponse } from "./fetch-utils";

export function useAdminHomeContent() {
  const auth = useAuth();
  const isAdmin = auth.user?.role === "admin";

  const [banner, setBanner] = useState<HomeBannerDto | null>(null);
  const [sliderItems, setSliderItems] = useState<HomeSliderItemDto[]>([]);
  const [testimonials, setTestimonials] = useState<HomeTestimonialDto[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<HomeInstagramPostDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAll = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [bannerRes, sliderRes, testimonialRes, instagramRes] = await Promise.all([
        fetch("/api/admin/home/banner"),
        fetch("/api/admin/home/slider"),
        fetch("/api/admin/home/testimonials"),
        fetch("/api/admin/home/instagram"),
      ]);

      if (bannerRes.ok) {
        const data = await parseJsonResponse<{ banner: HomeBannerDto }>(bannerRes);
        setBanner(data?.banner ?? null);
      }
      if (sliderRes.ok) {
        const data = await parseJsonResponse<{ items: HomeSliderItemDto[] }>(sliderRes);
        setSliderItems(data?.items ?? []);
      }
      if (testimonialRes.ok) {
        const data = await parseJsonResponse<{ testimonials: HomeTestimonialDto[] }>(testimonialRes);
        setTestimonials(data?.testimonials ?? []);
      }
      if (instagramRes.ok) {
        const data = await parseJsonResponse<{ posts: HomeInstagramPostDto[] }>(instagramRes);
        setInstagramPosts(data?.posts ?? []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  const saveBanner = useCallback(
    async (payload: Partial<HomeBannerDto>) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/home/banner", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ banner?: HomeBannerDto; message?: string }>(response);
        if (!response.ok || !data?.banner) {
          toast.error(data?.message ?? "ذخیره بنر انجام نشد.");
          return false;
        }
        setBanner(data.banner);
        toast.success("بنر به‌روزرسانی شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin]
  );

  const addSliderItem = useCallback(
    async (payload: { productId: string; sortOrder: number; active: boolean }) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch("/api/admin/home/slider", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await parseJsonResponse<{ message?: string }>(response);
        if (!response.ok) {
          toast.error(data?.message ?? "افزودن به اسلایدر انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success("به اسلایدر اضافه شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const updateSliderItem = useCallback(
    async (id: string, payload: Partial<HomeSliderItemDto>) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/home/slider/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          toast.error("به‌روزرسانی اسلایدر انجام نشد.");
          return false;
        }
        await loadAll();
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const deleteSliderItem = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/home/slider/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success("از اسلایدر حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const saveTestimonial = useCallback(
    async (payload: Partial<HomeTestimonialDto> & { id?: string }) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const isEdit = Boolean(payload.id);
        const response = await fetch(
          isEdit
            ? `/api/admin/home/testimonials/${encodeURIComponent(payload.id!)}`
            : "/api/admin/home/testimonials",
          {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          toast.error("ذخیره نظر انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success(isEdit ? "نظر به‌روزرسانی شد." : "نظر اضافه شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const deleteTestimonial = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(
          `/api/admin/home/testimonials/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success("نظر حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const saveInstagramPost = useCallback(
    async (payload: Partial<HomeInstagramPostDto> & { id?: string }) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const isEdit = Boolean(payload.id);
        const response = await fetch(
          isEdit
            ? `/api/admin/home/instagram/${encodeURIComponent(payload.id!)}`
            : "/api/admin/home/instagram",
          {
            method: isEdit ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) {
          toast.error("ذخیره پست انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success(isEdit ? "پست به‌روزرسانی شد." : "پست اضافه شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  const deleteInstagramPost = useCallback(
    async (id: string) => {
      if (!isAdmin) return false;
      setIsSaving(true);
      try {
        const response = await fetch(`/api/admin/home/instagram/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          toast.error("حذف انجام نشد.");
          return false;
        }
        await loadAll();
        toast.success("پست حذف شد.");
        return true;
      } finally {
        setIsSaving(false);
      }
    },
    [isAdmin, loadAll]
  );

  return {
    isAdmin,
    banner,
    sliderItems,
    testimonials,
    instagramPosts,
    isLoading,
    isSaving,
    loadAll,
    saveBanner,
    addSliderItem,
    updateSliderItem,
    deleteSliderItem,
    saveTestimonial,
    deleteTestimonial,
    saveInstagramPost,
    deleteInstagramPost,
  };
}
