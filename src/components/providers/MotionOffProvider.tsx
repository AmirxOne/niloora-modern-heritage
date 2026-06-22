"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

export function MotionOffProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <MotionConfig reducedMotion={hydrated ? "user" : "always"}>
      {children}
    </MotionConfig>
  );
}
