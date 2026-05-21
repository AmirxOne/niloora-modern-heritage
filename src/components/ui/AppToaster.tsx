"use client";

import { Toaster } from "sonner";
import { Check, MessageSquare, X } from "@/components/icons";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      dir="rtl"
      expand
      visibleToasts={4}
      closeButton
      icons={{
        success: <Check size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        error: <X size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        warning: <MessageSquare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
        info: <MessageSquare size={iconSizes.sm} variant={ICON_VARIANT} aria-hidden />,
      }}
      toastOptions={{
        duration: 4200,
        classNames: {
          toast:
            "group min-w-[18rem] rounded-heritage-lg border border-gold/20 bg-[#2b2622]/95 px-3 py-3 text-ivory ring-1 ring-black/10 backdrop-blur-xl",
          icon:
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/10 text-gold",
          title: "font-display text-sm font-semibold leading-tight tracking-wide text-ivory",
          description: "mt-0.5 text-xs leading-relaxed text-silver/95",
          actionButton:
            "rounded-heritage border border-gold/35 bg-gradient-to-l from-gold-dark via-gold to-gold-light px-3 text-white",
          cancelButton:
            "rounded-heritage border border-gold/20 bg-white/5 px-3 text-silver hover:border-gold/35 hover:bg-white/10 hover:text-ivory",
          closeButton:
            "border border-gold/20 bg-white/5 text-silver hover:bg-gold/10 hover:text-ivory",
          success: "border-emerald-500/35",
          error: "border-red-500/35",
          warning: "border-amber-500/35",
          info: "border-sky-500/35",
        },
      }}
    />
  );
}
