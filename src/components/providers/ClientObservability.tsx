"use client";

import { clientLogger } from "@/lib/observability/logger";
import { useEffect } from "react";

export function ClientObservability() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      clientLogger.error("Unhandled client error", { source: "window.onerror" }, event.error);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      clientLogger.error(
        "Unhandled promise rejection",
        { source: "window.onunhandledrejection" },
        event.reason
      );
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
