"use client";

import { cn } from "@/lib/utils";
import { fa } from "@/lib/i18n/fa";

interface ToggleChoiceProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
}

export function ToggleChoice({ value, onChange }: ToggleChoiceProps) {
  return (
    <div className="customizer-toggle-choice" role="group">
      <button
        type="button"
        className={cn(
          "customizer-toggle-btn",
          value === true && "customizer-toggle-btn--active"
        )}
        onClick={() => onChange(true)}
        aria-pressed={value === true}
      >
        {fa.customize.wizard.yes}
      </button>
      <button
        type="button"
        className={cn(
          "customizer-toggle-btn",
          value === false && "customizer-toggle-btn--active"
        )}
        onClick={() => onChange(false)}
        aria-pressed={value === false}
      >
        {fa.customize.wizard.no}
      </button>
    </div>
  );
}
