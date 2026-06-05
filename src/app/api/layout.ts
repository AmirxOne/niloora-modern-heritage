import type { ReactNode } from "react";
export { dynamic } from "@/lib/server/route-segment";

export default function ApiLayout({ children }: { children: ReactNode }) {
  return children;
}
