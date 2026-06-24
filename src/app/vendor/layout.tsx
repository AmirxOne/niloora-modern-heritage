import type { ReactNode } from "react";
import { VendorShell } from "@/components/vendor/VendorShell";

export const dynamic = "force-dynamic";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <VendorShell>{children}</VendorShell>;
}
