"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CustomizerState } from "@/lib/types";
import { METAL_OPTIONS, STONE_OPTIONS } from "@/lib/constants";
import { fa } from "@/lib/i18n/fa";

interface RingPreviewProps {
  state: CustomizerState;
  size?: "sm" | "md" | "lg";
  showControls?: boolean;
}

export function RingPreview({ state, size = "lg", showControls = true }: RingPreviewProps) {
  const metal = METAL_OPTIONS.find((m) => m.value === state.metal);
  const stone = STONE_OPTIONS.find((s) => s.value === state.stone);
  const metalColor = metal?.color ?? "#C4C9CE";
  const stoneColor = state.stoneColor || stone?.color || "#E8F4F8";

  const sizeClasses = {
    sm: "h-48 w-48",
    md: "h-72 w-72",
    lg: "h-96 w-96 max-w-full",
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-cinematic-radial" />
      <motion.div
        className={`relative ${sizeClasses[size]} flex items-center justify-center`}
        animate={{ rotateY: [0, 5, 0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* 360-style preview container */}
        <div className="absolute inset-0 rounded-full border border-subtle bg-gradient-to-b from-matte-surface/50 to-transparent" />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.metal}-${state.stone}-${state.bandStyle}-${state.stoneShape}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Ring band SVG */}
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full drop-shadow-luxury-gold"
              aria-label="Ring preview"
            >
              <defs>
                <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={metalColor} stopOpacity="1" />
                  <stop offset="50%" stopColor={metalColor} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={metalColor} stopOpacity="0.7" />
                </linearGradient>
                <radialGradient id="stoneGrad" cx="40%" cy="40%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="40%" stopColor={stoneColor} />
                  <stop offset="100%" stopColor={stoneColor} stopOpacity="0.8" />
                </radialGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Band - varies by style */}
              {state.bandStyle === "twisted" ? (
                <ellipse
                  cx="100"
                  cy="130"
                  rx="55"
                  ry="35"
                  fill="none"
                  stroke="url(#metalGrad)"
                  strokeWidth={state.thickness * 4}
                  transform="rotate(-15 100 130)"
                />
              ) : state.bandStyle === "filigree" ? (
                <g>
                  <ellipse cx="100" cy="130" rx="58" ry="38" fill="none" stroke="url(#metalGrad)" strokeWidth={state.thickness * 3.5} />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <line
                      key={angle}
                      x1={100 + 50 * Math.cos((angle * Math.PI) / 180)}
                      y1={130 + 32 * Math.sin((angle * Math.PI) / 180)}
                      x2={100 + 58 * Math.cos((angle * Math.PI) / 180)}
                      y2={130 + 38 * Math.sin((angle * Math.PI) / 180)}
                      stroke={metalColor}
                      strokeWidth="0.5"
                      opacity="0.6"
                    />
                  ))}
                </g>
              ) : (
                <ellipse
                  cx="100"
                  cy="130"
                  rx="58"
                  ry="38"
                  fill="none"
                  stroke="url(#metalGrad)"
                  strokeWidth={state.thickness * 4}
                />
              )}

              {/* Pavé dots */}
              {state.bandStyle === "pave" &&
                Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i / 12) * Math.PI * 2;
                  return (
                    <circle
                      key={i}
                      cx={100 + 56 * Math.cos(angle)}
                      cy={130 + 36 * Math.sin(angle)}
                      r="1.5"
                      fill="#E8F4F8"
                      opacity="0.8"
                    />
                  );
                })}

              {/* Stone - shape varies */}
              {state.stoneShape === "round" && (
                <circle cx="100" cy="75" r="22" fill="url(#stoneGrad)" filter="url(#glow)" />
              )}
              {state.stoneShape === "oval" && (
                <ellipse cx="100" cy="78" rx="18" ry="24" fill="url(#stoneGrad)" filter="url(#glow)" />
              )}
              {state.stoneShape === "cushion" && (
                <rect x="78" y="58" width="44" height="40" rx="6" fill="url(#stoneGrad)" filter="url(#glow)" />
              )}
              {state.stoneShape === "princess" && (
                <polygon points="100,52 122,75 100,98 78,75" fill="url(#stoneGrad)" filter="url(#glow)" />
              )}
              {state.stoneShape === "pear" && (
                <ellipse cx="100" cy="78" rx="16" ry="26" fill="url(#stoneGrad)" filter="url(#glow)" transform="rotate(180 100 78)" />
              )}
              {state.stoneShape === "marquise" && (
                <ellipse cx="100" cy="78" rx="26" ry="14" fill="url(#stoneGrad)" filter="url(#glow)" />
              )}

              {/* Prong setting */}
              {[0, 90, 180, 270].map((angle) => (
                <line
                  key={angle}
                  x1={100 + 18 * Math.cos((angle * Math.PI) / 180)}
                  y1={75 + 18 * Math.sin((angle * Math.PI) / 180)}
                  x2={100 + 24 * Math.cos((angle * Math.PI) / 180)}
                  y2={75 + 24 * Math.sin((angle * Math.PI) / 180)}
                  stroke={metalColor}
                  strokeWidth="2"
                />
              ))}

              {/* Carving pattern overlay */}
              {state.carving !== "none" && (
                <g opacity="0.15" stroke={metalColor} strokeWidth="0.5" fill="none">
                  {state.carving === "eslimi" && (
                    <path d="M60 130 Q80 110 100 130 T140 130" />
                  )}
                  {state.carving === "geometric" && (
                    <>
                      <polygon points="70,125 80,115 90,125 80,135" />
                      <polygon points="110,125 120,115 130,125 120,135" />
                    </>
                  )}
                </g>
              )}
            </svg>

            {/* Engraving preview */}
            {state.engravingText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-8 start-1/2 -translate-x-1/2 font-persian text-sm text-gold/80"
              >
                {state.engravingText}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-0 start-1/2 flex -translate-x-1/2 gap-2"
          >
            <span className="rounded-full border border-stone-200 bg-stone-900/50 px-3 py-1 text-[10px] text-silver backdrop-blur">
              {fa.common.preview360}
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.p
        key={state.metal + state.stone}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-center text-xs tracking-wider text-silver"
      >
        {fa.customize.previewLabel(metal?.label ?? "", stone?.label ?? "", state.size)}
      </motion.p>
    </div>
  );
}
