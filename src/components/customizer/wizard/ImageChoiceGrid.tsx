"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface ImageChoiceOption {
  id: string;
  name: string;
  description?: string;
  image: string;
  meta?: string;
}

interface ImageChoiceGridProps {
  options: ImageChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
  compact?: boolean;
}

export function ImageChoiceGrid({
  options,
  value,
  onChange,
  columns = 2,
  compact = false,
}: ImageChoiceGridProps) {
  return (
    <ul
      className={cn(
        "customizer-choice-grid",
        columns === 3 && "customizer-choice-grid--cols-3",
        columns === 4 && "customizer-choice-grid--cols-4"
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn(
                "customizer-choice-card",
                compact && "customizer-choice-card--compact",
                selected && "customizer-choice-card--selected"
              )}
              aria-pressed={selected}
            >
              <span className="customizer-choice-card-media">
                <Image
                  src={opt.image}
                  alt={opt.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </span>
              <span className="customizer-choice-card-body">
                <span className="customizer-choice-card-name">{opt.name}</span>
                {opt.description ? (
                  <span className="customizer-choice-card-desc">{opt.description}</span>
                ) : null}
                {opt.meta ? (
                  <span className="customizer-choice-card-meta">{opt.meta}</span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
