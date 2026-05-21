"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export function MotionOffProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="always" transition={{ duration: 0, delay: 0 }}>
      {children}
    </MotionConfig>
  );
}
