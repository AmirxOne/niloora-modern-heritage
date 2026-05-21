"use client";

import Image from "next/image";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ICON_VARIANT, iconSizes } from "@/lib/icons";
import type { ImageChoiceOption } from "./ImageChoiceGrid";

interface ChoiceGalleryProps {
  options: ImageChoiceOption[];
  value: string | null;
  onChange: (id: string) => void;
  columns?: 2 | 3 | 4;
}

export function ChoiceGallery({
  options,
  value,
  onChange,
  columns = 3,
}: ChoiceGalleryProps) {
  return (
    <ul
      className={cn(
        "choice-gallery",
        columns === 2 && "choice-gallery--cols-2",
        columns === 3 && "choice-gallery--cols-3",
        columns === 4 && "choice-gallery--cols-4"
      )}
    >
      {options.map((opt) => {
        const selected = value === opt.id;
        return (
          <li key={opt.id}>
            <button
              type="button"
              onClick={() => onChange(opt.id)}
              className={cn("choice-gallery-card", selected && "choice-gallery-card--selected")}
              aria-pressed={selected}
            >
              <span className="choice-gallery-card-media">
                <Image
                  src={opt.image}
                  alt={opt.name}
                  fill
                  className="choice-gallery-card-image"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <span className="choice-gallery-card-scrim" aria-hidden />
                {selected ? (
                  <span className="choice-gallery-card-check" aria-hidden>
                    <Check size={iconSizes.sm} variant={ICON_VARIANT} />
                  </span>
                ) : null}
              </span>
              <span className="choice-gallery-card-body">
                <span className="choice-gallery-card-name">{opt.name}</span>
                {opt.description ? (
                  <span className="choice-gallery-card-desc">{opt.description}</span>
                ) : null}
                {opt.meta ? <span className="choice-gallery-card-meta">{opt.meta}</span> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
