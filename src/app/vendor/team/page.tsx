"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  VendorCard,
  VendorPageHeader,
  useVendorProfile,
} from "@/components/vendor/VendorShell";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/loading/LoadingState";
import { fa } from "@/lib/i18n/fa";
import { formatIranPhoneDisplay } from "@/lib/auth/phone";

type TeamMember = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  role: "owner" | "staff";
  active: boolean;
  joinedAt: string;
};

const t = fa.vendor.team;

export default function VendorTeamPage() {
  const { vendor, loading: profileLoading } = useVendorProfile();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOwner = vendor?.memberRole === "owner";

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/vendor/team", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMembers(data.members ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (vendor?.status !== "active") {
      setLoading(false);
      return;
    }
    load();
  }, [vendor, load]);

  async function handleAdd() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/team", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? fa.vendor.errorGeneric);
        return;
      }
      toast.success(t.added);
      setPhone("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    const res = await fetch(`/api/vendor/team/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? fa.vendor.errorGeneric);
      return;
    }
    toast.success(t.removed);
    load();
  }

  if (profileLoading || loading) {
    return <LoadingState variant="vendor-team" className="py-2" label={fa.vendor.loading} />;
  }

  if (!vendor || vendor.status !== "active") {
    return (
      <section>
        <VendorPageHeader title={t.title} />
        <VendorCard>
          <p className="text-silver">{fa.vendor.vendorInactive}</p>
        </VendorCard>
      </section>
    );
  }

  return (
    <section className="space-y-6 pb-12">
      <VendorPageHeader title={t.title} />

      {isOwner ? (
        <VendorCard>
          <p className="mb-3 text-sm text-silver">{t.addHint}</p>
          <div className="flex flex-wrap gap-3">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              inputMode="tel"
              dir="ltr"
              className="h-11 min-w-0 flex-1 rounded-heritage border border-subtle bg-matte px-4 text-sm text-ivory placeholder:text-silver/60 focus:border-gold focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={submitting || !phone.trim()}
              className="inline-flex h-11 items-center rounded-heritage bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark disabled:opacity-50"
            >
              {submitting ? fa.vendor.loading : t.add}
            </button>
          </div>
        </VendorCard>
      ) : (
        <VendorCard className="border-gold/20 bg-gold/5">
          <p className="text-sm text-silver">{t.staffViewOnly}</p>
        </VendorCard>
      )}

      <div className="overflow-x-auto rounded-heritage border border-subtle">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-subtle text-silver">
              <th className="px-3 py-3 text-right font-medium">{t.name}</th>
              <th className="px-3 py-3 text-right font-medium">{t.phone}</th>
              <th className="px-3 py-3 text-right font-medium">{t.role}</th>
              <th className="px-3 py-3 text-right font-medium">{t.joinedAt}</th>
              {isOwner ? <th className="px-3 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-subtle/60 last:border-0">
                <td className="px-3 py-3 text-ivory">{m.name}</td>
                <td className="px-3 py-3 text-silver" dir="ltr">
                  {formatIranPhoneDisplay(m.phone)}
                </td>
                <td className="px-3 py-3">
                  <Badge variant={m.role === "owner" ? "gold" : "default"}>
                    {m.role === "owner" ? t.roleOwner : t.roleStaff}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-silver">
                  {new Date(m.joinedAt).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                {isOwner ? (
                  <td className="px-3 py-3 text-left">
                    {m.role === "staff" ? (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.id)}
                        className="rounded-heritage border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        {t.remove}
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
