"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { ChevronDown, Check, Search } from "@/components/icons";
import type {
  SelectBoxBlurEvent,
  SelectBoxChangeEvent,
  SelectBoxOption,
} from "@/components/inputs/selectBox/types";
import { fieldControlClass, FIELD_CONTROL_ERROR_CLASS } from "./fieldStyles";
import { ICON_VARIANT } from "@/lib/icons";

export type { SelectBoxOption, SelectBoxChangeEvent, SelectBoxBlurEvent };

export interface SelectBoxProps {
  label?: string;
  error?: string;
  touched?: boolean;
  className?: string;
  id?: string;
  name?: string;
  value?: string;
  options: SelectBoxOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyOptionsMessage?: string;
  onChange?: (event: SelectBoxChangeEvent) => void;
  onValueChange?: (value: string) => void;
  onBlur?: (event: SelectBoxBlurEvent) => void;
}

const DROPDOWN_GAP_PX = 4;
const DROPDOWN_MAX_HEIGHT_PX = 224;
const DROPDOWN_Z_INDEX = 70;

type DropdownLayout = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

function estimateDropdownHeight(
  optionCount: number,
  searchable: boolean
): number {
  const optionHeight = 40;
  const searchBlock = searchable ? 48 : 0;
  const padding = 8;
  return Math.min(optionCount * optionHeight + searchBlock + padding, DROPDOWN_MAX_HEIGHT_PX);
}

function getBottomObstructionPx(): number {
  if (typeof window === "undefined") return 0;

  const mobileNav = document.querySelector('nav[aria-label="ناوبری اصلی موبایل"]');
  if (!(mobileNav instanceof HTMLElement)) return 0;

  const style = window.getComputedStyle(mobileNav);
  if (style.display === "none" || style.visibility === "hidden") return 0;

  return mobileNav.getBoundingClientRect().height;
}

function computeDropdownLayout(
  buttonRect: DOMRect,
  dropdownHeight: number
): DropdownLayout {
  const bottomObstruction = getBottomObstructionPx();
  const spaceBelow = window.innerHeight - buttonRect.bottom - DROPDOWN_GAP_PX - bottomObstruction;
  const spaceAbove = buttonRect.top - DROPDOWN_GAP_PX;

  let placement: "bottom" | "top";
  if (spaceBelow >= dropdownHeight) placement = "bottom";
  else if (spaceAbove >= dropdownHeight) placement = "top";
  else placement = spaceAbove > spaceBelow ? "top" : "bottom";

  const available = placement === "bottom" ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(96, Math.min(DROPDOWN_MAX_HEIGHT_PX, available));
  const renderedHeight = Math.min(dropdownHeight, maxHeight);
  const top =
    placement === "bottom"
      ? buttonRect.bottom + DROPDOWN_GAP_PX
      : buttonRect.top - DROPDOWN_GAP_PX - renderedHeight;

  return {
    top,
    left: buttonRect.left,
    width: buttonRect.width,
    maxHeight,
  };
}

function SelectBox({
  label,
  className,
  error,
  touched,
  id: idProp,
  name,
  value = "",
  options,
  placeholder,
  disabled = false,
  searchable = false,
  searchPlaceholder = "جستجو...",
  emptyOptionsMessage = "گزینه‌ای یافت نشد",
  onChange,
  onValueChange,
  onBlur,
}: SelectBoxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const listboxId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<DropdownLayout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selectedOption = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!searchable || !q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery, searchable]);

  const emitChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue);
      onChange?.({ target: { name, value: newValue } });
    },
    [name, onChange, onValueChange]
  );

  const emitBlur = useCallback(() => {
    onBlur?.({ target: { name } });
  }, [name, onBlur]);

  const close = useCallback(() => {
    setOpen(false);
    setDropdownLayout(null);
    setSearchQuery("");
    setHighlightIndex(0);
  }, []);

  const updateDropdownLayout = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const dropdownHeight =
      listboxRef.current?.offsetHeight ??
      estimateDropdownHeight(filteredOptions.length, searchable);

    setDropdownLayout(computeDropdownLayout(buttonRect, dropdownHeight));
  }, [filteredOptions.length, searchable]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;

    setOpen((prev) => {
      if (prev) return false;

      const button = buttonRef.current;
      if (button) {
        const buttonRect = button.getBoundingClientRect();
        const dropdownHeight = estimateDropdownHeight(filteredOptions.length, searchable);
        setDropdownLayout(computeDropdownLayout(buttonRect, dropdownHeight));
      }

      return true;
    });
  }, [disabled, filteredOptions.length, searchable]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listboxRef.current?.contains(target)) return;
      close();
      emitBlur();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        emitBlur();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, emitBlur]);

  useEffect(() => {
    if (open && searchable) requestAnimationFrame(() => searchInputRef.current?.focus());
  }, [open, searchable]);

  useLayoutEffect(() => {
    if (!open) return;

    updateDropdownLayout();

    window.addEventListener("resize", updateDropdownLayout);
    window.addEventListener("scroll", updateDropdownLayout, true);
    return () => {
      window.removeEventListener("resize", updateDropdownLayout);
      window.removeEventListener("scroll", updateDropdownLayout, true);
    };
  }, [open, updateDropdownLayout, filteredOptions.length, searchQuery]);

  const selectOption = (option: SelectBoxOption) => {
    if (option.disabled) return;
    emitChange(option.value);
    close();
    emitBlur();
  };

  const hasError = Boolean(error && touched);
  const displayLabel = selectedOption?.label ?? placeholder ?? "";

  const listbox =
    mounted && open && dropdownLayout
      ? createPortal(
          <div
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            dir="rtl"
            className="overflow-hidden rounded-heritage border border-gold/15 bg-matte-elevated shadow-heritage"
            style={{
              position: "fixed",
              top: dropdownLayout.top,
              left: dropdownLayout.left,
              width: dropdownLayout.width,
              maxHeight: dropdownLayout.maxHeight,
              zIndex: DROPDOWN_Z_INDEX,
            }}
          >
            {searchable ? (
              <div className="border-b border-gold/10 p-2">
                <div className="relative">
                  <Search
                    size={14}
                    variant={ICON_VARIANT}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-silver"
                  />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightIndex(0);
                    }}
                    placeholder={searchPlaceholder}
                    className="field-control field-control--sm pr-7 text-right"
                  />
                </div>
              </div>
            ) : null}

            <ul className="max-h-full overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-center text-xs text-silver">{emptyOptionsMessage}</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value;
                  const isHighlighted = index === highlightIndex;
                  return (
                    <li key={`${option.value}-${index}`} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={option.disabled}
                        onMouseEnter={() => setHighlightIndex(index)}
                        onClick={() => selectOption(option)}
                        className={clsx(
                          "flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors",
                          option.disabled && "cursor-not-allowed opacity-50",
                          !option.disabled && "cursor-pointer",
                          isHighlighted || isSelected
                            ? "bg-gold/10 text-ivory"
                            : "text-silver hover:bg-white/5 hover:text-ivory"
                        )}
                      >
                        <span className="min-w-0 truncate">{option.label}</span>
                        {isSelected ? (
                          <Check size={14} variant={ICON_VARIANT} className="shrink-0 text-gold" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={rootRef} className={clsx("relative flex flex-col", className)} dir="rtl">
      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {label ? (
        <label
          htmlFor={id}
          className={clsx(
            "pointer-events-none absolute -top-2 start-3 z-10 rounded-sm bg-matte-elevated px-1 text-[11px] font-medium leading-none",
            hasError ? "text-red-400" : "text-silver"
          )}
        >
          {label}
        </label>
      ) : null}

      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={toggleOpen}
        className={fieldControlClass(
          "flex items-center justify-between gap-2 text-start",
          hasError && FIELD_CONTROL_ERROR_CLASS,
          disabled && "cursor-not-allowed opacity-60",
          !disabled && "cursor-pointer",
          open && !hasError && "border-turquoise/45 ring-2 ring-turquoise/15"
        )}
      >
        <span className={clsx("flex-1 min-w-0 truncate", selectedOption ? "text-ivory" : "text-silver/70")}>
          {displayLabel}
        </span>
        <ChevronDown
          size={16}
          variant={ICON_VARIANT}
          className={clsx("shrink-0 text-silver transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {listbox}

      {hasError ? (
        <div className="mt-1">
          <span className="rounded-[4px] bg-red-500/20 p-0.5 px-2 text-[10px] font-bold text-red-400">{error}</span>
        </div>
      ) : null}
    </div>
  );
}

SelectBox.displayName = "SelectBox";

export default SelectBox;
