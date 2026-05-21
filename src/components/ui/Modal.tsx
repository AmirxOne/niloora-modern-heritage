"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** کلاس اضافه روی پنل دیالوگ */
  panelClassName?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  panelClassName,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative z-10 w-full overflow-hidden rounded-heritage-xl border border-[#E5E1DB] bg-white",
              "shadow-[0_8px_32px_rgba(44,42,41,0.12)]",
              sizeClasses[size],
              panelClassName
            )}
            role="dialog"
            aria-modal
          >
            {title ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between border-b border-[#F0EDE9] px-6 py-4"
              >
                <h2 className="font-display text-xl text-ivory">{title}</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-control-sm w-control-sm items-center justify-center rounded-full border border-transparent text-silver transition-colors hover:bg-parchment hover:text-ivory"
                  aria-label="Close"
                >
                  <X size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                </button>
              </motion.div>
            ) : null}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
