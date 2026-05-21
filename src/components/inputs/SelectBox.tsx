"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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
    setSearchQuery("");
    setHighlightIndex(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
        emitBlur();
      }
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

  const selectOption = (option: SelectBoxOption) => {
    if (option.disabled) return;
    emitChange(option.value);
    close();
    emitBlur();
  };

  const hasError = Boolean(error && touched);
  const displayLabel = selectedOption?.label ?? placeholder ?? "";

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
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((prev) => !prev)}
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

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-heritage border border-gold/15 bg-matte-elevated shadow-heritage"
        >
          {searchable ? (
            <div className="border-b border-gold/10 p-2">
              <div className="relative">
                <Search size={14} variant={ICON_VARIANT} className="absolute right-2 top-1/2 -translate-y-1/2 text-silver" />
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

          <ul className="max-h-56 overflow-y-auto py-1">
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
                      {isSelected ? <Check size={14} variant={ICON_VARIANT} className="shrink-0 text-gold" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

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
