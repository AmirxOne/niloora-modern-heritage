"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { rememberAppPath } from "@/lib/navigation/access-redirect";

export function LastPathTracker() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    rememberAppPath(path);
  }, [pathname, searchParams]);

  return null;
}
