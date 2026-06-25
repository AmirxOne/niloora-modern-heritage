"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { cn } from "@/lib/utils";
import { ICON_VARIANT } from "@/lib/icons";

interface CommentPublishIdentitySelectProps {
  accountDisplayName: string;
  publishAnonymously: boolean;
  onChange: (publishAnonymously: boolean) => void;
  className?: string;
}

type IdentityOption = {
  value: "named" | "anonymous";
  title: string;
  subtitle: string;
};

const DROPDOWN_Z_INDEX = 100;

export function CommentPublishIdentitySelect({
  accountDisplayName,
  publishAnonymously,
  onChange,
  className,
}: CommentPublishIdentitySelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number; width: number } | null>(
    null
  );

  const options: IdentityOption[] = [
    {
      value: "named",
      title: accountDisplayName,
      subtitle: fa.product.commentPublishNamedHint,
    },
    {
      value: "anonymous",
      title: fa.product.commentPublishAnonymous,
      subtitle: fa.product.commentPublishAnonymousHint,
    },
  ];

  const selected = publishAnonymously ? options[1] : options[0];

  const close = useCallback(() => {
    setOpen(false);
    setMenuStyle(null);
  }, []);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setMenuStyle({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useLayoutEffect(() => {
    if (!open) return;

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  const selectOption = (value: "named" | "anonymous") => {
    onChange(value === "anonymous");
    close();
  };

  const menu =
    mounted && open && menuStyle
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={fa.product.commentPublishIdentityLabel}
            data-modal-portal-dropdown=""
            className="product-comment-publish-select-menu product-comment-publish-select-menu--portal"
            onPointerDown={(event) => event.preventDefault()}
            style={{
              position: "fixed",
              top: menuStyle.top,
              left: menuStyle.left,
              width: menuStyle.width,
              zIndex: DROPDOWN_Z_INDEX,
            }}
          >
            {options.map((option) => {
              const isSelected =
                option.value === "anonymous" ? publishAnonymously : !publishAnonymously;

              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "product-comment-publish-select-option",
                      isSelected && "product-comment-publish-select-option--active"
                    )}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      selectOption(option.value);
                    }}
                  >
                    <span className="product-comment-publish-select-option-text">
                      <span className="product-comment-publish-select-title">{option.title}</span>
                      <span className="product-comment-publish-select-subtitle">{option.subtitle}</span>
                    </span>
                    {isSelected ? (
                      <Check size={14} variant={ICON_VARIANT} className="shrink-0 text-gold" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={cn("product-comment-publish-select", className)}>
      <p className="product-comment-field-label">{fa.product.commentPublishIdentityLabel}</p>

      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "product-comment-publish-select-trigger",
          open && "product-comment-publish-select-trigger--open"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) {
              requestAnimationFrame(updateMenuPosition);
            }
            return next;
          });
        }}
      >
        <span className="product-comment-publish-select-trigger-text">
          <span className="product-comment-publish-select-title">{selected.title}</span>
          <span className="product-comment-publish-select-subtitle">{selected.subtitle}</span>
        </span>
        <ChevronDown
          size={16}
          variant={ICON_VARIANT}
          className={cn(
            "product-comment-publish-select-chevron",
            open && "product-comment-publish-select-chevron--open"
          )}
          aria-hidden
        />
      </button>

      {menu}
    </div>
  );
}
