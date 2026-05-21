"use client";

import { useEffect } from "react";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { buildQuoteRequestTitle } from "@/lib/customizer/quote-summary";
import { useCustomizer } from "@/lib/hooks/useCustomizer";
import { useApp } from "@/lib/context/AppContext";
import { formatPrice } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";
import { CustomizerWizard } from "@/components/customizer/CustomizerWizard";
import { CompatibilityNotice } from "@/components/customizer/CompatibilityNotice";
import { Ring3DPreview, getPreviewModeForStep } from "@/components/customizer/Ring3DPreview";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TextBox } from "@/components/inputs";
import { PageTransition } from "@/components/layout/PageTransition";
import type { WizardStepId } from "@/lib/customizer/wizard";

export default function CustomizePage() {
  const router = useRouter();
  const { state, update, batchUpdate, loadState, reset, price, recentChanges, dismissChanges } =
    useCustomizer();
  const { cart, designs, auth, quoteRequests } = useApp();
  const searchParams = useSearchParams();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteSuccessId, setQuoteSuccessId] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [shareToast, setShareToast] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStepId>("master");

  useEffect(() => {
    const encoded = searchParams.get("design");
    if (!encoded) return;
    try {
      const parsed = JSON.parse(decodeURIComponent(escape(atob(encoded))));
      if (parsed && typeof parsed === "object") {
        loadState(parsed);
      }
    } catch {
      // Invalid shared config is ignored intentionally.
    }
  }, [searchParams, loadState]);

  const selectedHighlights = useMemo(
    () => [
      { label: "استادکار", value: state.shankMaster },
      { label: "مدل رکاب", value: state.shankModelId },
      { label: "نگین", value: state.stone },
      { label: "برش", value: state.stoneShape },
      { label: "سایز", value: state.size.toLocaleString("fa-IR") },
      { label: "ضخامت", value: `${state.thickness.toLocaleString("fa-IR")} mm` },
    ],
    [state]
  );

  const handleSave = () => {
    if (!designName.trim()) return;
    designs.saveDesign(designName.trim(), state, price);
    setSaveModalOpen(false);
    setDesignName("");
  };

  const openQuoteModal = () => {
    if (!auth.isLoggedIn) {
      router.push("/auth?redirect=/customize");
      return;
    }
    setQuoteNote("");
    setQuoteModalOpen(true);
  };

  const handleSubmitQuote = async () => {
    const title = buildQuoteRequestTitle(state);
    const quote = await quoteRequests.submitQuoteRequest({
      configuration: state,
      title,
      customerNote: quoteNote.trim() || undefined,
      estimateTotal: price,
    });
    if (!quote) return;
    setQuoteModalOpen(false);
    setQuoteSuccessId(quote.id);
  };

  const handleShare = async () => {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const url = `${window.location.origin}/customize?design=${data}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3000);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-matte pb-14 pt-24">
        <motion.div
          className="site-container space-y-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <header className="overflow-hidden rounded-heritage-lg border border-gold/20 bg-matte-elevated p-5 shadow-heritage md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-dark">
                {fa.customize.eyebrow}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={reset} className="h-9 px-3 text-xs">
                  بازنشانی کامل
                </Button>
                <Button variant="ghost" onClick={() => setSaveModalOpen(true)} className="h-9 px-3 text-xs">
                  ذخیره طرح
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-ivory-light md:text-3xl">
                  استودیو حرفه‌ای سفارشی‌سازی انگشتر
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-silver">{fa.customize.studioSubtitle}</p>
              </div>
              <motion.div
                className="rounded-heritage border border-turquoise/30 bg-turquoise/10 px-4 py-3 text-end shadow-glass"
                layout
              >
                <span className="block text-xs text-silver">{fa.customize.wizard.estimatedPrice}</span>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={price}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mt-1 block text-xl font-bold text-turquoise-light"
                  >
                    {formatPrice(price)}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedHighlights.map((item) => (
                <span
                  key={item.label}
                  className="rounded-full border border-gold/15 bg-parchment/60 px-3 py-1 text-xs text-silver"
                >
                  <span className="text-ivory-light">{item.label}:</span> {item.value}
                </span>
              ))}
            </div>
          </header>

          <CompatibilityNotice items={recentChanges} onDismiss={dismissChanges} />

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section
              className="rounded-heritage-lg border border-gold/15 bg-matte-elevated p-4 shadow-heritage md:p-6"
              aria-label={fa.customize.title}
            >
              <CustomizerWizard
                state={state}
                onUpdate={update}
                onBatchUpdate={batchUpdate}
                onStepChange={setWizardStep}
                estimateTotal={price}
                onRequestWorkshopQuote={openQuoteModal}
                isSubmittingQuote={quoteRequests.isSubmitting}
              />
            </section>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit" aria-label={fa.customize.preview3dTitle}>
              <div className="rounded-heritage-lg border border-gold/15 bg-matte-elevated p-4 shadow-heritage">
                <p className="mb-3 text-xs text-silver">{fa.customize.preview3dTitle}</p>
                <Ring3DPreview state={state} mode={getPreviewModeForStep(wizardStep)} />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={() => setSaveModalOpen(true)} variant="outline" className="flex-1">
                    {fa.customize.saveDesign}
                  </Button>
                  <Button onClick={handleShare} variant="ghost" className="flex-1">
                    {fa.customize.shareDesign}
                  </Button>
                  <Button
                    onClick={() =>
                      cart.addCustomDesign(designName || fa.customize.customRing, price, state)
                    }
                    variant="turquoise"
                    className="col-span-2 w-full"
                  >
                    {fa.customize.addToCart}
                  </Button>
                </div>
                <div className="mt-4 rounded-heritage border border-gold/15 bg-gold/5 p-3 text-xs leading-6 text-silver">
                  قیمت بالا برآورد لحظه‌ای کارگاه است. قیمت نهایی پس از بازبینی فنی نگین، سایز و جزئیات حکاکی
                  تایید می‌شود.
                </div>
                <AnimatePresence>
                  {shareToast ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="customize-studio-share-toast"
                    >
                      {fa.customize.shareCopied}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
              <div className="rounded-heritage-lg border border-gold/15 bg-matte-elevated p-4 text-sm text-silver shadow-heritage">
                <p className="mb-2 text-sm font-semibold text-ivory-light">استاندارد استودیو</p>
                <ul className="space-y-2 leading-6">
                  <li>• همه مرحله‌ها با قواعد سازگاری فنی کارگاه کنترل می‌شود.</li>
                  <li>• ترکیب‌های ناسازگار خودکار اصلاح می‌شوند و به شما اطلاع داده می‌شود.</li>
                  <li>• خروجی نهایی مستقیم برای افزودن به سبد و ثبت سفارش آماده است.</li>
                </ul>
              </div>
            </aside>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        title={fa.customize.wizard.quoteModalTitle}
        size="sm"
      >
        <div className="space-y-4 p-6">
          <p className="text-sm leading-7 text-silver">{fa.customize.wizard.quoteHint}</p>
          <p className="text-sm text-ivory">
            {fa.customize.wizard.estimatedPrice}: <strong>{formatPrice(price)}</strong>
          </p>
          <TextBox
            label={fa.customize.wizard.quoteModalNoteLabel}
            placeholder={fa.customize.wizard.quoteModalNotePlaceholder}
            value={quoteNote}
            onChange={(e) => setQuoteNote(e.target.value)}
          />
          <Button
            className="w-full"
            variant="turquoise"
            onClick={() => void handleSubmitQuote()}
            disabled={quoteRequests.isSubmitting}
            isLoading={quoteRequests.isSubmitting}
          >
            {fa.customize.wizard.quoteModalSubmit}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(quoteSuccessId)}
        onClose={() => setQuoteSuccessId(null)}
        title={fa.customize.wizard.quoteSuccessTitle}
        size="sm"
      >
        <div className="space-y-4 p-6">
          <p className="text-sm leading-7 text-silver">
            {quoteSuccessId ? fa.customize.wizard.quoteSuccessBody(quoteSuccessId) : ""}
          </p>
          <Link href="/account#quotes" onClick={() => setQuoteSuccessId(null)}>
            <Button className="w-full" variant="outline">
              {fa.dashboard.workshopQuotes}
            </Button>
          </Link>
        </div>
      </Modal>

      <Modal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title={fa.customize.saveModalTitle}
        size="sm"
      >
        <div className="space-y-4 p-6">
          <TextBox
            label={fa.customize.designName}
            placeholder={fa.customize.designNamePlaceholder}
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
          />
          <Button className="w-full" onClick={handleSave} disabled={!designName.trim()}>
            {fa.customize.saveToAccount}
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
