"use client";

import { Drawer } from "vaul";
import { X } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional extra classes for modal panel container. */
  panelClassName?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

function isModalPortalDropdownTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(target.closest("[data-modal-portal-dropdown]"))
  );
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  panelClassName,
}: ModalProps) {
  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            "fixed inset-0 z-[60] flex items-center justify-center p-4 outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
          )}
          onPointerDownOutside={(event) => {
            if (isModalPortalDropdownTarget(event.target)) {
              event.preventDefault();
            }
          }}
        >
          <div
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
              <div className="flex items-center justify-between border-b border-[#F0EDE9] px-5 py-3.5">
                <Drawer.Title asChild>
                  <h2 className="font-display text-xl text-ivory">{title}</h2>
                </Drawer.Title>
                <Drawer.Close asChild>
                  <button
                    type="button"
                    className="inline-flex h-control-sm w-control-sm items-center justify-center rounded-full border border-transparent text-silver transition-colors hover:bg-parchment hover:text-ivory"
                    aria-label="Close"
                  >
                    <X size={iconSizes.md} variant={ICON_VARIANT} aria-hidden />
                  </button>
                </Drawer.Close>
              </div>
            ) : null}
            <div>{children}</div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
