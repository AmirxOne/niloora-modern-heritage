"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { MetalType, StoneType } from "@/lib/types";
import { METAL_OPTIONS, STONE_OPTIONS } from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";

interface Ring360PreviewProps {
  metal: MetalType;
  stone: StoneType;
}

export function Ring360Preview({ metal, stone }: Ring360PreviewProps) {
  const [rotation, setRotation] = useState(0);
  const metalColor = METAL_OPTIONS.find((m) => m.value === metal)?.color ?? "#C4C9CE";
  const stoneColor = STONE_OPTIONS.find((s) => s.value === stone)?.color ?? "#E8F4F8";

  return (
    <div className="relative rounded-sm border border-stone-200 bg-matte-elevated p-8">
      <p className="mb-4 text-center text-xs text-silver">{fa.product.preview360Title}</p>
      <div className="relative mx-auto flex h-64 w-64 items-center justify-center">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDrag={(_, info) => setRotation((r) => r - info.delta.x * 0.5)}
          className="cursor-grab active:cursor-grabbing"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <defs>
              <linearGradient id="previewMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={metalColor} />
                <stop offset="100%" stopColor={metalColor} stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <ellipse cx="100" cy="130" rx="58" ry="38" fill="none" stroke="url(#previewMetal)" strokeWidth="12" />
            <circle cx="100" cy="75" r="22" fill={stoneColor} opacity="0.9" />
            {[0, 90, 180, 270].map((angle) => (
              <line key={angle} x1={100 + 18 * Math.cos((angle * Math.PI) / 180)} y1={75 + 18 * Math.sin((angle * Math.PI) / 180)} x2={100 + 24 * Math.cos((angle * Math.PI) / 180)} y2={75 + 24 * Math.sin((angle * Math.PI) / 180)} stroke={metalColor} strokeWidth="2" />
            ))}
          </svg>
        </motion.div>
      </div>
      <p className="mt-4 text-center text-[10px] text-silver/60">{fa.common.dragRotate}</p>
    </div>
  );
}
