"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Stepper, type StepperStep } from "@/components/ui/Stepper";
import { TextBox } from "@/components/inputs";
import { PageTransition } from "@/components/layout/PageTransition";
import { TomanPrice } from "@/components/commerce/TomanPrice";
import { StatusAlert } from "@/components/ui/StatusAlert";
import { listAllArtisans } from "@/lib/artisans";
import { useApp } from "@/lib/context/AppContext";
import { ImageChoiceGrid } from "@/components/customizer/wizard/ImageChoiceGrid";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { resolvePieceCode } from "@/lib/products/piece-code";
import type { ProductAvailability } from "@/lib/types";
import type {
  RingCustomizationPublicConfigDto,
  RingPurchaseCustomization,
} from "@/lib/types/ring-customization";
import { parseJsonResponse } from "@/lib/hooks/fetch-utils";
import {
  DEFAULT_PRODUCT_IMAGE,
  RING_CARVING_PATTERN_FLORAL_IMAGE,
  SITE_ARTISAN_WORKSHOP_IMAGE,
} from "@/lib/images";

type BranchState = "unchanged" | "customized" | "opted_out";
type CustomizeStep = "size" | "shank" | "stone" | "review";

const CUSTOMIZE_STEP_ORDER: CustomizeStep[] = ["size", "shank", "stone", "review"];

type ProductPayload = {
  id: string;
  name: string;
  namePersian: string;
  image: string;
  price: number;
  listPrice?: number;
  availability: ProductAvailability;
};

function normalizeFaText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

function relatedBySelection<T extends { id: string }>(
  items: T[],
  selectedId: string,
  sourceIds: string[]
): T[] {
  if (!selectedId || items.length <= 1 || sourceIds.length <= 1) return items;
  const selectedIndex = sourceIds.indexOf(selectedId);
  if (selectedIndex < 0) return items;
  const related = items.filter((_, index) => index % sourceIds.length === selectedIndex % sourceIds.length);
  if (related.length > 0) return related;
  return [items[selectedIndex % items.length]];
}

export default function CustomizePage() {
  const { cart } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId") ?? "";
  const cartItemId = searchParams.get("cartItemId") ?? "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [config, setConfig] = useState<RingCustomizationPublicConfigDto | null>(null);

  const [useSize, setUseSize] = useState(true);
  const [useShank, setUseShank] = useState(true);
  const [useStone, setUseStone] = useState(true);
  const [size, setSize] = useState<number | null>(null);
  const [shankState, setShankState] = useState<BranchState>("unchanged");
  const [stoneState, setStoneState] = useState<BranchState>("unchanged");
  const [shankArtisanId, setShankArtisanId] = useState("");
  const [shankPatternId, setShankPatternId] = useState("");
  const [stoneArtisanId, setStoneArtisanId] = useState("");
  const [stoneTextId, setStoneTextId] = useState("");
  const [scriptStyleId, setScriptStyleId] = useState("");
  const [shankDesignerQuery, setShankDesignerQuery] = useState("");
  const [shankPatternQuery, setShankPatternQuery] = useState("");
  const [stoneArtisanQuery, setStoneArtisanQuery] = useState("");
  const [textQuery, setTextQuery] = useState("");
  const [scriptStyleQuery, setScriptStyleQuery] = useState("");
  const [preview, setPreview] = useState<RingPurchaseCustomization | null>(null);
  const [step, setStep] = useState<CustomizeStep>("size");

  const cartItem = useMemo(() => {
    if (cartItemId) {
      const byId = cart.items.find((item) => item.id === cartItemId);
      if (byId) return byId;
    }
    const sameProduct = cart.items.filter(
      (item) => item.productId === productId && !item.customizerState
    );
    if (sameProduct.length === 0) return undefined;
    return sameProduct.find((item) => Boolean(item.ringPurchaseCustomization)) ?? sameProduct[0];
  }, [cart.items, cartItemId, productId]);

  const carvingArtisansFromDirectory = useMemo(
    () => {
      const all = listAllArtisans();
      const carvingOnly = all.filter((artisan) => artisan.primaryRole === "carving-master");
      if (carvingOnly.length > 0) return carvingOnly;
      return all.filter((artisan) => artisan.primaryRole === "band-engraver");
    },
    []
  );

  const shankDesignerOptions = useMemo(() => {
    const catalog = config?.catalog.shankArtisans ?? [];
    if (!catalog.length) return [];
    if (!carvingArtisansFromDirectory.length) {
      return catalog.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.imageUrl || DEFAULT_PRODUCT_IMAGE,
        meta: `+${item.priceAdd.toLocaleString("fa-IR")} تومان`,
      }));
    }

    const normalizedCatalog = catalog.map((item) => ({
      ...item,
      normalizedName: normalizeFaText(item.name),
    }));
    const usedIds = new Set<string>();
    const matchedArtisanSlugs = new Set<string>();

    const mapped = carvingArtisansFromDirectory.flatMap((artisan) => {
      const normalizedArtisanName = normalizeFaText(artisan.name);
      const match = normalizedCatalog.find(
        (item) =>
          !usedIds.has(item.id) &&
          (item.normalizedName === normalizedArtisanName ||
            item.normalizedName.includes(normalizedArtisanName) ||
            normalizedArtisanName.includes(item.normalizedName))
      );
      if (!match) return [];
      usedIds.add(match.id);
      matchedArtisanSlugs.add(artisan.slug);
      return [
        {
          id: match.id,
          name: artisan.name,
          image: artisan.image || match.imageUrl || DEFAULT_PRODUCT_IMAGE,
          meta: `+${match.priceAdd.toLocaleString("fa-IR")} تومان`,
        },
      ];
    });

    const remainingCatalog = catalog.filter((item) => !usedIds.has(item.id));
    const unmatchedArtisans = carvingArtisansFromDirectory.filter(
      (artisan) => !matchedArtisanSlugs.has(artisan.slug)
    );
    const pairedFromPeople = unmatchedArtisans
      .slice(0, remainingCatalog.length)
      .map((artisan, idx) => {
        const source = remainingCatalog[idx];
        return {
          id: source.id,
          name: artisan.name,
          image: artisan.image || source.imageUrl || DEFAULT_PRODUCT_IMAGE,
          meta: `+${source.priceAdd.toLocaleString("fa-IR")} تومان`,
        };
      });

    return [...mapped, ...pairedFromPeople];
  }, [carvingArtisansFromDirectory, config?.catalog.shankArtisans]);

  const filteredShankDesigners = useMemo(() => {
    const query = normalizeFaText(shankDesignerQuery);
    if (!query) return shankDesignerOptions;
    return shankDesignerOptions.filter((item) => normalizeFaText(item.name).includes(query));
  }, [shankDesignerOptions, shankDesignerQuery]);

  const relatedShankPatterns = useMemo(() => {
    const patterns = config?.catalog.shankPatterns ?? [];
    return relatedBySelection(
      patterns,
      shankArtisanId,
      shankDesignerOptions.map((item) => item.id)
    );
  }, [config?.catalog.shankPatterns, shankArtisanId, shankDesignerOptions]);

  const filteredShankPatterns = useMemo(() => {
    const query = normalizeFaText(shankPatternQuery);
    if (!query) return relatedShankPatterns;
    return relatedShankPatterns.filter((item) => normalizeFaText(item.name).includes(query));
  }, [relatedShankPatterns, shankPatternQuery]);

  const filteredStoneArtisans = useMemo(() => {
    const artisans = config?.catalog.stoneArtisans ?? [];
    const query = normalizeFaText(stoneArtisanQuery);
    if (!query) return artisans;
    return artisans.filter((item) => normalizeFaText(item.name).includes(query));
  }, [config?.catalog.stoneArtisans, stoneArtisanQuery]);

  const relatedStoneTextsByArtisan = useMemo(() => {
    const texts = config?.catalog.stoneTexts ?? [];
    return relatedBySelection(
      texts,
      stoneArtisanId,
      (config?.catalog.stoneArtisans ?? []).map((item) => item.id)
    );
  }, [config?.catalog.stoneTexts, config?.catalog.stoneArtisans, stoneArtisanId]);

  const relatedScriptStylesByArtisan = useMemo(() => {
    const styles = config?.catalog.scriptStyles ?? [];
    return relatedBySelection(
      styles,
      stoneArtisanId,
      (config?.catalog.stoneArtisans ?? []).map((item) => item.id)
    );
  }, [config?.catalog.scriptStyles, config?.catalog.stoneArtisans, stoneArtisanId]);

  const relatedStoneTexts = useMemo(
    () =>
      relatedBySelection(
        relatedStoneTextsByArtisan,
        scriptStyleId,
        relatedScriptStylesByArtisan.map((item) => item.id)
      ),
    [relatedStoneTextsByArtisan, scriptStyleId, relatedScriptStylesByArtisan]
  );

  const relatedScriptStyles = useMemo(
    () =>
      relatedBySelection(
        relatedScriptStylesByArtisan,
        stoneTextId,
        relatedStoneTextsByArtisan.map((item) => item.id)
      ),
    [relatedScriptStylesByArtisan, stoneTextId, relatedStoneTextsByArtisan]
  );

  const filteredStoneTexts = useMemo(() => {
    const query = normalizeFaText(textQuery);
    if (!query) return relatedStoneTexts;
    return relatedStoneTexts.filter(
      (item) =>
        normalizeFaText(item.name).includes(query) ||
        normalizeFaText(item.meaning ?? "").includes(query)
    );
  }, [relatedStoneTexts, textQuery]);

  const filteredScriptStyles = useMemo(() => {
    const query = normalizeFaText(scriptStyleQuery);
    if (!query) return relatedScriptStyles;
    return relatedScriptStyles.filter((item) => normalizeFaText(item.name).includes(query));
  }, [relatedScriptStyles, scriptStyleQuery]);

  const unitBasePrice = product?.price ?? 0;
  const estimatedUnitPrice = unitBasePrice + (preview?.totalCustomizationDelta ?? 0);
  const productDisplayName = product ? getProductDisplayName(product) : "";
  const selectedShankDesigner = shankDesignerOptions.find((item) => item.id === shankArtisanId);
  const selectedShankPattern = config?.catalog.shankPatterns.find((item) => item.id === shankPatternId);
  const selectedStoneArtisan = config?.catalog.stoneArtisans.find((item) => item.id === stoneArtisanId);
  const selectedScriptStyle = config?.catalog.scriptStyles.find((item) => item.id === scriptStyleId);
  const selectedStoneText = config?.catalog.stoneTexts.find((item) => item.id === stoneTextId);
  const stepIndex = Math.max(0, CUSTOMIZE_STEP_ORDER.indexOf(step));
  const nextStep = CUSTOMIZE_STEP_ORDER[Math.min(CUSTOMIZE_STEP_ORDER.length - 1, stepIndex + 1)];
  const prevStep = CUSTOMIZE_STEP_ORDER[Math.max(0, stepIndex - 1)];
  const stepperSteps = useMemo<StepperStep[]>(
    () =>
      CUSTOMIZE_STEP_ORDER.map((item) => ({
        id: item,
        label:
          item === "size"
            ? "سایز"
            : item === "shank"
              ? "قلم‌کاری"
              : item === "stone"
                ? "حکاکی"
                : "بازبینی",
        description:
          item === "size"
            ? "ثبت سایز نهایی تحویل"
            : item === "shank"
              ? "تنظیمات قلم‌کاری رکاب"
              : item === "stone"
                ? "تنظیمات حکاکی سنگ"
                : "تایید نهایی و اعمال در سبد",
      })),
    []
  );

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    void (async () => {
      try {
        const [productRes, configRes] = await Promise.all([
          fetch(`/api/products/${encodeURIComponent(productId)}`),
          fetch(`/api/products/${encodeURIComponent(productId)}/ring-customization`),
        ]);
        const productData = await parseJsonResponse<{ product?: ProductPayload }>(productRes);
        const configData = await parseJsonResponse<{
          ringCustomization?: RingCustomizationPublicConfigDto;
          message?: string;
        }>(configRes);
        if (!productRes.ok || !productData?.product) {
          toast.error("محصول پیدا نشد.");
          return;
        }
        if (!configRes.ok || !configData?.ringCustomization) {
          toast.error(configData?.message ?? "شخصی‌سازی برای این محصول فعال نیست.");
          return;
        }
        setProduct(productData.product);
        setConfig(configData.ringCustomization);
        setSize(configData.ringCustomization.config.sizeBase ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  useEffect(() => {
    if (!cartItem?.ringPurchaseCustomization) return;
    const ring = cartItem.ringPurchaseCustomization;
    const normalizedRing =
      product && ring.productId !== resolvePieceCode(product)
        ? { ...ring, productId: resolvePieceCode(product) }
        : ring;
    setPreview(normalizedRing);
    if (ring.size) {
      setUseSize(true);
      setSize(ring.size.selected);
    }
    if (ring.shank) {
      setUseShank(true);
      setShankState(ring.shank.state);
      setShankArtisanId(ring.shank.artisanId ?? "");
      setShankPatternId(ring.shank.patternId ?? "");
    }
    if (ring.stone) {
      setUseStone(true);
      setStoneState(ring.stone.state);
      setStoneArtisanId(ring.stone.artisanId ?? "");
      setStoneTextId(ring.stone.textId ?? "");
      setScriptStyleId(ring.stone.scriptStyleId ?? "");
    }
  }, [cartItem?.ringPurchaseCustomization, product]);

  useEffect(() => {
    if (shankState !== "customized") return;
    if (filteredShankPatterns.length === 0) {
      if (shankPatternId) setShankPatternId("");
      return;
    }
    if (!shankPatternId || !filteredShankPatterns.some((item) => item.id === shankPatternId)) {
      setShankPatternId(filteredShankPatterns[0].id);
    }
  }, [shankState, filteredShankPatterns, shankPatternId]);

  useEffect(() => {
    if (stoneState !== "customized") return;
    if (filteredStoneTexts.length === 0) {
      if (stoneTextId) setStoneTextId("");
      return;
    }
    if (!stoneTextId || !filteredStoneTexts.some((item) => item.id === stoneTextId)) {
      setStoneTextId(filteredStoneTexts[0].id);
    }
  }, [stoneState, filteredStoneTexts, stoneTextId]);

  useEffect(() => {
    if (stoneState !== "customized") return;
    if (filteredScriptStyles.length === 0) {
      if (scriptStyleId) setScriptStyleId("");
      return;
    }
    if (!scriptStyleId || !filteredScriptStyles.some((item) => item.id === scriptStyleId)) {
      setScriptStyleId(filteredScriptStyles[0].id);
    }
  }, [stoneState, filteredScriptStyles, scriptStyleId]);

  const previewPrice = useCallback(async () => {
    if (!productId) return;
    setSaving(true);
    try {
      const response = await fetch("/api/ring-customization/price-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          size: useSize && size != null ? { selected: size } : undefined,
          shank: useShank
            ? {
                state: shankState,
                artisanId: shankArtisanId || undefined,
                patternId: shankPatternId || undefined,
              }
            : undefined,
          stone: useStone
            ? {
                state: stoneState,
                artisanId: stoneArtisanId || undefined,
                textId: stoneTextId || undefined,
                scriptStyleId: scriptStyleId || undefined,
              }
            : undefined,
        }),
      });
      const data = await parseJsonResponse<{
        customization?: RingPurchaseCustomization;
        message?: string;
      }>(response);
      if (!response.ok || !data?.customization) {
        toast.error(data?.message ?? "محاسبه قیمت انجام نشد.");
        return;
      }
      setPreview(data.customization);
    } finally {
      setSaving(false);
    }
  }, [
    productId,
    useSize,
    size,
    useShank,
    shankState,
    shankArtisanId,
    shankPatternId,
    useStone,
    stoneState,
    stoneArtisanId,
    stoneTextId,
    scriptStyleId,
  ]);

  useEffect(() => {
    if (!config || !productId) return;
    const timeout = window.setTimeout(() => {
      void previewPrice();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [config, productId, previewPrice]);

  const applyToCart = () => {
    if (!preview || !product) return;
    if (cartItem) {
      const previousDelta = cartItem.ringPurchaseCustomization?.totalCustomizationDelta ?? 0;
      const basePrice = cartItem.price - previousDelta;
      const baseList = (cartItem.listPrice ?? cartItem.price) - previousDelta;
      const nextPrice = Math.max(0, basePrice + preview.totalCustomizationDelta);
      const nextList = Math.max(nextPrice, baseList + preview.totalCustomizationDelta);
      cart.updateRingCustomization(cartItem.id, {
        price: nextPrice,
        listPrice: nextList,
        ringPurchaseCustomization: preview,
      });
      toast.success("شخصی‌سازی روی قلم سبد اعمال شد.");
      router.push("/cart");
      return;
    }

    cart.addItem({
      productId: product.id,
      name: product.namePersian || product.name,
      image: product.image,
      availability: product.availability,
      price: Math.max(0, product.price + preview.totalCustomizationDelta),
      listPrice: Math.max(
        product.price + preview.totalCustomizationDelta,
        (product.listPrice ?? product.price) + preview.totalCustomizationDelta
      ),
      ringPurchaseCustomization: preview,
    });
    toast.success("محصول شخصی‌سازی‌شده به سبد اضافه شد.");
    router.push("/cart");
  };

  if (!productId) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-matte pb-14 pt-24">
          <div className="site-container max-w-3xl">
            <div className="rounded-heritage-lg border border-gold/15 bg-matte-elevated p-6">
              <h1 className="text-xl font-semibold text-ivory">شخصی‌سازی خرید</h1>
              <p className="mt-2 text-sm text-silver">
                ابتدا یک محصول انگشتر را انتخاب کنید و سپس روی دکمه «شخصی‌سازی خرید» بزنید.
              </p>
              <Link href="/shop" className="mt-4 inline-block">
                <Button>رفتن به فروشگاه</Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-matte pb-14 pt-10">
        <div className="site-container">
          <section className="mb-4 rounded-heritage border border-gold/15 bg-matte-elevated px-4 py-3 md:px-5">
            <h1 className="text-lg font-semibold text-ivory-light md:text-xl">شخصی‌سازی خرید انگشتر</h1>
            <p className="mt-1 text-xs leading-6 text-silver md:text-sm">
              انتخاب‌های خود را مرحله‌به‌مرحله انجام دهید؛ قیمت نهایی و زمان آماده‌سازی به‌صورت لحظه‌ای نمایش داده می‌شود.
            </p>
          </section>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <header className="rounded-heritage-lg border border-gold/20 bg-matte-elevated p-5 lg:order-2 lg:h-fit lg:sticky lg:top-24">
              {loading || !product ? (
                <div className="grid gap-3" aria-busy="true" aria-live="polite">
                  <div className="sk aspect-square w-full rounded-heritage" />
                  <div className="grid gap-2">
                    <div className="sk h-6 w-4/5 rounded-heritage" />
                    <div className="mt-1 grid gap-2">
                      <div className="sk h-4 w-2/3 rounded-heritage" />
                      <div className="sk h-4 w-3/5 rounded-heritage" />
                      <div className="sk h-4 w-3/4 rounded-heritage" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  <div className="relative aspect-square w-full overflow-hidden rounded-heritage border border-gold/15 bg-parchment">
                    <Image
                      src={product.image || DEFAULT_PRODUCT_IMAGE}
                      alt={product ? getProductDisplayName(product) : ""}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-ivory-light">
                      {productDisplayName}
                    </h1>
                    <div className="mt-2 grid gap-1 text-sm text-silver">
                      <span>
                        قیمت پایه: <TomanPrice amount={unitBasePrice} size="xs" />
                      </span>
                      <span>
                        تغییر قیمت: <TomanPrice amount={preview?.totalCustomizationDelta ?? 0} size="xs" />
                      </span>
                      <span className="font-semibold text-price-sale">
                        قیمت نهایی: <TomanPrice amount={estimatedUnitPrice} size="xs" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </header>

            <div className="rounded-heritage border border-gold/15 bg-parchment/20 p-3 lg:order-1 flex flex-col">
            {loading ? (
              <div className="mt-4 grid gap-3 lg:flex-1" aria-busy="true" aria-live="polite">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="sk h-7 w-20 rounded-full" />
                  <span className="sk h-7 w-16 rounded-full" />
                  <span className="sk h-7 w-20 rounded-full" />
                  <span className="sk h-7 w-20 rounded-full" />
                  <span className="sk h-7 w-20 rounded-full" />
                </div>
                <div className="grid gap-3 rounded-heritage border border-gold/10 p-3">
                  <div className="sk h-4 w-36" />
                  <div className="sk h-10 w-full rounded-heritage" />
                  <div className="sk h-10 w-full rounded-heritage" />
                  <div className="sk h-10 w-2/3 rounded-heritage" />
                </div>
                <div className="grid gap-3 rounded-heritage border border-gold/10 p-3">
                  <div className="sk h-4 w-28" />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <div className="sk aspect-square w-full rounded-heritage" />
                    <div className="sk aspect-square w-full rounded-heritage" />
                    <div className="sk aspect-square w-full rounded-heritage" />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-gold/10 bg-parchment/95 py-2 lg:mt-auto">
                  <span className="sk h-11 w-28 rounded-heritage" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="sk h-11 w-24 rounded-heritage" />
                    <span className="sk h-11 w-24 rounded-heritage" />
                  </div>
                </div>
              </div>
            ) : config ? (
              <div className="mt-4 flex flex-1 flex-col gap-3">
                <Stepper
                  steps={stepperSteps}
                  currentStepId={step}
                  completedStepIds={CUSTOMIZE_STEP_ORDER.slice(0, stepIndex)}
                  orientation="horizontal"
                  onStepClick={(stepId) => setStep(stepId as CustomizeStep)}
                />

                {step === "size" ? (
                  <div className="grid gap-2">
                    <TextBox
                      label={
                        config.config.sizeMin != null && config.config.sizeMax != null
                          ? `سایز تحویل (${config.config.sizeMin} تا ${config.config.sizeMax})`
                          : "سایز تحویل"
                      }
                      value={String(size ?? config.config.sizeBase ?? "")}
                      onChange={(e) => {
                        setUseSize(true);
                        setSize(Number(e.target.value) || config.config.sizeBase);
                      }}
                      inputClassName="auth-input-ltr"
                    />
                    <StatusAlert
                      tone="info"
                      title="راهنمای انتخاب سایز"
                      action={
                        <Link
                          href="/ring-size"
                          className="inline-flex items-center text-sm font-semibold text-gold-dark underline decoration-gold/60 underline-offset-4 transition-colors hover:text-gold"
                        >
                          باز کردن راهنمای سایز
                        </Link>
                      }
                    >
                      برای انتخاب دقیق سایز، از ابزار راهنمای سایز استفاده کنید و سپس مقدار مناسب را
                      در این مرحله وارد کنید.
                    </StatusAlert>
                  </div>
                ) : null}

                {step === "shank" ? (
                  <div className="customizer-shank-panel">
                    <div className="customizer-shank-block">
                      <p className="customizer-shank-label">حالت قلم‌کاری</p>
                      <div className="customizer-shank-state-grid">
                        {([
                          { id: "unchanged", label: "بدون تغییر" },
                          { id: "customized", label: "شخصی‌سازی" },
                          { id: "opted_out", label: "قلم‌کاری نمی‌خواهم" },
                        ] as const).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setUseShank(true);
                              setShankState(option.id);
                              if (option.id === "customized") {
                                if (!shankArtisanId && shankDesignerOptions.length) {
                                  setShankArtisanId(shankDesignerOptions[0].id);
                                }
                                if (!shankPatternId && config.catalog.shankPatterns.length) {
                                  setShankPatternId(config.catalog.shankPatterns[0].id);
                                }
                              }
                            }}
                            className={`customizer-shank-state-btn ${
                              shankState === option.id
                                ? "customizer-shank-state-btn--active"
                                : ""
                            }`}
                            aria-current={shankState === option.id ? "true" : undefined}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {shankState === "customized" ? (
                      <>
                        <section className="customizer-shank-block mt-2">
                          <p className="customizer-shank-label mb-3">طراحان قلم کاری رکاب</p>
                        <TextBox
                          label="جستجوی طراح قلم کاری رکاب"
                          value={shankDesignerQuery}
                          onChange={(event) => setShankDesignerQuery(event.target.value)}
                        />
                        <ImageChoiceGrid
                          options={filteredShankDesigners}
                          value={shankArtisanId || null}
                          onChange={(value) => {
                            setUseShank(true);
                            setShankArtisanId(value);
                          }}
                          compact
                          columns={3}
                        />
                        {filteredShankDesigners.length === 0 ? (
                          <p className="text-xs text-silver/90">طراحی با این عبارت پیدا نشد.</p>
                        ) : null}
                        </section>
                        <section className="customizer-shank-block customizer-shank-block--divider">
                        <p className="customizer-shank-label mb-3">طراحی قلم‌کاری رکاب</p>
                        <TextBox
                          label="جستجوی طراحی قلم‌کاری رکاب"
                          value={shankPatternQuery}
                          onChange={(event) => setShankPatternQuery(event.target.value)}
                        />
                        <ImageChoiceGrid
                          options={filteredShankPatterns.map((item) => ({
                            id: item.id,
                            name: item.name,
                            image: item.imageUrl || RING_CARVING_PATTERN_FLORAL_IMAGE,
                            meta: `+${item.priceAdd.toLocaleString("fa-IR")} تومان`,
                          }))}
                          value={shankPatternId || null}
                          onChange={(value) => {
                            setUseShank(true);
                            setShankPatternId(value);
                          }}
                          columns={4}
                        />
                        {filteredShankPatterns.length === 0 ? (
                          <p className="text-xs text-silver/90">طرحی با این عبارت پیدا نشد.</p>
                        ) : null}
                        </section>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {step === "stone" ? (
                  <div className="customizer-shank-panel">
                    <div className="customizer-shank-block">
                      <p className="customizer-shank-label">حالت حکاکی</p>
                      <div className="customizer-shank-state-grid">
                        {([
                          { id: "unchanged", label: "بدون تغییر" },
                          { id: "customized", label: "شخصی‌سازی" },
                          { id: "opted_out", label: "حکاکی نمی‌خواهم" },
                        ] as const).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => {
                              setUseStone(true);
                              setStoneState(option.id);
                            }}
                            className={`customizer-shank-state-btn ${
                              stoneState === option.id
                                ? "customizer-shank-state-btn--active"
                                : ""
                            }`}
                            aria-current={stoneState === option.id ? "true" : undefined}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    {stoneState === "customized" ? (
                      <>
                        <section className="customizer-shank-block mt-2">
                        <p className="customizer-shank-label mb-3">طراح حکاکی</p>
                        <TextBox
                          label="جستجوی طراح حکاکی"
                          value={stoneArtisanQuery}
                          onChange={(event) => setStoneArtisanQuery(event.target.value)}
                        />
                        <ImageChoiceGrid
                          options={filteredStoneArtisans.map((item) => ({
                            id: item.id,
                            name: item.name,
                            image: item.imageUrl || DEFAULT_PRODUCT_IMAGE,
                            meta: `+${item.priceAdd.toLocaleString("fa-IR")} تومان`,
                          }))}
                          value={stoneArtisanId || null}
                          onChange={(value) => {
                            setUseStone(true);
                            setStoneArtisanId(value);
                          }}
                          compact
                          columns={3}
                        />
                        {filteredStoneArtisans.length === 0 ? (
                          <p className="text-xs text-silver/90">طراحی با این عبارت پیدا نشد.</p>
                        ) : null}
                        </section>
                        <section className="customizer-shank-block customizer-shank-block--divider">
                        <p className="customizer-shank-label mb-3">سبک خط</p>
                        <TextBox
                          label="جستجوی سبک خط"
                          value={scriptStyleQuery}
                          onChange={(event) => setScriptStyleQuery(event.target.value)}
                        />
                        <ImageChoiceGrid
                          options={filteredScriptStyles.map((item) => ({
                            id: item.id,
                            name: item.name,
                            image: item.imageUrl || DEFAULT_PRODUCT_IMAGE,
                            meta: `+${item.priceAdd.toLocaleString("fa-IR")} تومان`,
                          }))}
                          value={scriptStyleId || null}
                          onChange={(value) => {
                            setUseStone(true);
                            setScriptStyleId(value);
                          }}
                          columns={4}
                        />
                        {filteredScriptStyles.length === 0 ? (
                          <p className="text-xs text-silver/90">سبک خطی با این عبارت پیدا نشد.</p>
                        ) : null}
                        </section>
                        <section className="customizer-shank-block customizer-shank-block--divider">
                        <p className="customizer-shank-label mb-3">متن حک</p>
                        <TextBox label="جستجوی متن حک" value={textQuery} onChange={(e) => setTextQuery(e.target.value)} />
                        <ImageChoiceGrid
                          options={filteredStoneTexts.map((item) => ({
                            id: item.id,
                            name: item.name,
                            description: item.description || undefined,
                            image: item.imageUrl || SITE_ARTISAN_WORKSHOP_IMAGE,
                            meta: `+${item.priceAdd.toLocaleString("fa-IR")} تومان`,
                          }))}
                          value={stoneTextId || null}
                          onChange={(value) => {
                            setUseStone(true);
                            setStoneTextId(value);
                          }}
                          columns={4}
                        />
                        {filteredStoneTexts.length === 0 ? (
                          <p className="text-xs text-silver/90">متنی با این عبارت پیدا نشد.</p>
                        ) : null}
                        </section>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {step === "review" ? (
                  <div className="grid gap-3 text-sm">
                    <div className="rounded-heritage border border-gold/10 bg-matte-surface/40 p-3">
                      <p className="text-sm font-semibold text-ivory">بازبینی نهایی انتخاب‌ها</p>
                      <p className="mt-1 text-xs text-silver">
                        قبل از اعمال در سبد، جزئیات هر مرحله را بررسی کنید.
                      </p>
                    </div>

                    <div className="grid gap-2 rounded-heritage border border-gold/10 bg-parchment/40 p-3">
                      <p className="text-xs font-semibold text-gold">مرحله سایز</p>
                      {!useSize ? (
                        <p className="text-xs text-silver">این مرحله رد شده است.</p>
                      ) : (
                        <>
                          <p className="text-xs text-silver">
                            سایز انتخابی:{" "}
                            <span className="font-semibold text-ivory">
                              {(size ?? config?.config.sizeBase ?? 0).toLocaleString("fa-IR")}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            تغییر قیمت مرحله: <TomanPrice amount={preview?.size?.priceDelta ?? 0} size="xs" />
                          </p>
                        </>
                      )}
                    </div>

                    <div className="grid gap-2 rounded-heritage border border-gold/10 bg-parchment/40 p-3">
                      <p className="text-xs font-semibold text-gold">مرحله قلم‌کاری</p>
                      {!useShank ? (
                        <p className="text-xs text-silver">این مرحله رد شده است.</p>
                      ) : shankState === "opted_out" ? (
                        <p className="text-xs text-silver">قلم‌کاری برای این سفارش غیرفعال شد.</p>
                      ) : shankState === "unchanged" ? (
                        <p className="text-xs text-silver">قلم‌کاری رکاب بدون تغییر می‌ماند.</p>
                      ) : (
                        <>
                          <p className="text-xs text-silver">
                            طراح انتخابی:{" "}
                            <span className="font-semibold text-ivory">
                              {selectedShankDesigner?.name ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            طرح انتخابی:{" "}
                            <span className="font-semibold text-ivory">
                              {selectedShankPattern?.name ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            تغییر قیمت مرحله: <TomanPrice amount={preview?.shank?.priceDelta ?? 0} size="xs" />
                          </p>
                        </>
                      )}
                    </div>

                    <div className="grid gap-2 rounded-heritage border border-gold/10 bg-parchment/40 p-3">
                      <p className="text-xs font-semibold text-gold">مرحله حکاکی</p>
                      {!useStone ? (
                        <p className="text-xs text-silver">این مرحله رد شده است.</p>
                      ) : stoneState === "opted_out" ? (
                        <p className="text-xs text-silver">حکاکی برای این سفارش غیرفعال شد.</p>
                      ) : stoneState === "unchanged" ? (
                        <p className="text-xs text-silver">حکاکی سنگ بدون تغییر می‌ماند.</p>
                      ) : (
                        <>
                          <p className="text-xs text-silver">
                            طراح حکاکی:{" "}
                            <span className="font-semibold text-ivory">
                              {selectedStoneArtisan?.name ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            سبک خط:{" "}
                            <span className="font-semibold text-ivory">
                              {selectedScriptStyle?.name ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            متن حک:{" "}
                            <span className="font-semibold text-ivory">
                              {selectedStoneText?.name ?? "—"}
                            </span>
                          </p>
                          <p className="text-xs text-silver">
                            تغییر قیمت مرحله: <TomanPrice amount={preview?.stone?.priceDelta ?? 0} size="xs" />
                          </p>
                        </>
                      )}
                    </div>

                    <div className="rounded-heritage border border-gold/20 bg-matte-elevated/45 p-3">
                      <p className="text-sm font-semibold text-ivory">جمع کل سفارش</p>
                      <div className="mt-2 grid gap-1 text-xs text-silver">
                        <p>
                          قیمت پایه: <TomanPrice amount={unitBasePrice} size="xs" />
                        </p>
                        <p>
                          تغییر قیمت شخصی‌سازی: <TomanPrice amount={preview?.totalCustomizationDelta ?? 0} size="xs" />
                        </p>
                        <p className="font-semibold text-price-sale">
                          قیمت نهایی هر عدد: <TomanPrice amount={estimatedUnitPrice} size="xs" />
                        </p>
                        {preview?.leadTimeDaysDelta ? (
                          <p>
                            زمان آماده‌سازی اضافه: {preview.leadTimeDaysDelta.toLocaleString("fa-IR")} روز
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-10 flex flex-wrap items-center justify-between gap-2 lg:sticky lg:bottom-0 lg:z-10">
                  <Button variant="outline" disabled={stepIndex === 0} onClick={() => setStep(prevStep)}>
                    مرحله قبل
                  </Button>
                  <div className="flex flex-wrap items-center gap-2">
                    {step !== "review" ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          if (step === "size") setUseSize(false);
                          if (step === "shank") setUseShank(false);
                          if (step === "stone") setUseStone(false);
                          setStep(nextStep);
                        }}
                      >
                        رد کردن
                      </Button>
                    ) : null}
                    {step !== "review" ? (
                      <Button onClick={() => setStep(nextStep)}>مرحله بعد</Button>
                    ) : (
                      <Button disabled={!preview || saving} onClick={applyToCart}>
                        اعمال در سبد
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-silver">تنظیمات این محصول در دسترس نیست.</p>
            )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
