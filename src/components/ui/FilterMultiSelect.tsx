"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "@/components/icons";
import { fa } from "@/lib/i18n/fa";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

export interface FilterMultiSelectOption<T extends string> {
  value: T;
  label: string;
  swatch?: string;
}

function normalizeFilterText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

interface FilterMultiSelectProps<T extends string> {
  label: string;
  options: FilterMultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  searchPlaceholder?: string;
}

export function FilterMultiSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  searchPlaceholder = fa.shop.filterSearchPlaceholder,
}: FilterMultiSelectProps<T>) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filteredOptions = useMemo(() => {
    const q = normalizeFilterText(query);
    if (!q) return options;
    return options.filter((o) => normalizeFilterText(o.label).includes(q));
  }, [options, query]);

  const triggerLabel = useMemo(() => {
    if (value.length === 0) return fa.shop.filterAll;
    if (value.length === 1) {
      return options.find((o) => o.value === value[0])?.label ?? fa.shop.filterSelected(value.length);
    }
    return fa.shop.filterSelected(value.length);
  }, [options, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (optionValue: T) => {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div ref={rootRef} className={cn("filter-multi", open && "filter-multi--open")}>
      <span className="filter-multi-label">{label}</span>
      <button
        type="button"
        className="filter-multi-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="filter-multi-trigger-text">{triggerLabel}</span>
        <ChevronDown
          size={iconSizes.sm}
          variant={ICON_VARIANT}
          className="filter-multi-chevron"
          aria-hidden
        />
      </button>

      {open ? (
        <div className="filter-multi-popover" role="presentation">
          <div className="filter-multi-search-wrap">
            <Search
              size={iconSizes.sm}
              variant={ICON_VARIANT}
              className="filter-multi-search-icon"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="filter-multi-search"
              aria-label={searchPlaceholder}
            />
            {query ? (
              <button
                type="button"
                className="filter-multi-search-clear"
                onClick={() => setQuery("")}
                aria-label={fa.common.remove}
              >
                <X size={iconSizes.xs} variant={ICON_VARIANT} />
              </button>
            ) : null}
          </div>

          <div className="filter-multi-actions">
            <button type="button" className="filter-multi-action" onClick={clearAll}>
              {fa.shop.filterClearSelection}
            </button>
          </div>

          <ul id={listId} className="filter-multi-list" role="listbox" aria-multiselectable>
            {filteredOptions.length === 0 ? (
              <li className="filter-multi-empty">{fa.shop.filterNoResults}</li>
            ) : (
              filteredOptions.map((opt) => {
                const checked = selectedSet.has(opt.value);
                return (
                  <li key={opt.value} role="option" aria-selected={checked}>
                    <button
                      type="button"
                      className={cn("filter-multi-option", checked && "filter-multi-option--selected")}
                      onClick={() => toggle(opt.value)}
                    >
                      <span
                        className={cn(
                          "filter-multi-checkbox",
                          checked && "filter-multi-checkbox--checked"
                        )}
                        aria-hidden
                      />
                      {opt.swatch ? (
                        <span
                          className="filter-multi-swatch"
                          style={{ backgroundColor: opt.swatch }}
                          aria-hidden
                        />
                      ) : null}
                      <span className="filter-multi-option-label">{opt.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
