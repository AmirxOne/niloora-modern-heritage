import { redirect } from "next/navigation";

/** Legacy route — middleware also redirects `/dashboard` → `/account`. */
export default function DashboardRedirectPage() {
  redirect("/account");
}
