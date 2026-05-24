"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { assignExperimentVariant } from "@/lib/ab/assignment";
import { readOrCreateAbIdentity } from "@/lib/ab/storage";
import { trackAbEvent } from "@/lib/ab/tracker";

export function useAbExperiment(experimentId: string) {
  const pathname = usePathname();
  const [identity, setIdentity] = useState("ssr");

  useEffect(() => {
    setIdentity(readOrCreateAbIdentity());
  }, []);

  const variantId = useMemo(
    () => assignExperimentVariant(experimentId, identity) ?? "control",
    [experimentId, identity]
  );
  const sentExposure = useRef(false);

  useEffect(() => {
    if (sentExposure.current) return;
    if (identity === "ssr") return;
    sentExposure.current = true;
    void trackAbEvent({
      experimentId,
      variantId,
      identity,
      type: "exposure",
      page: pathname,
    });
  }, [experimentId, variantId, identity, pathname]);

  return { experimentId, variantId, identity };
}
