"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuditLogs } from "@/lib/hooks/useAdminAuditLogs";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextBox } from "@/components/inputs";

const actionOptions = [
  { value: "", label: "همه اقدامات" },
  { value: "admin.products.create", label: "ایجاد محصول" },
  { value: "admin.products.update", label: "ویرایش محصول" },
  { value: "admin.products.delete", label: "حذف محصول" },
  { value: "admin.products.bulk_update", label: "ویرایش گروهی محصول" },
  { value: "admin.orders.update", label: "ویرایش سفارش" },
  { value: "admin.promo.create", label: "ایجاد کد تخفیف" },
  { value: "admin.promo.update", label: "ویرایش کد تخفیف" },
  { value: "admin.promo.delete", label: "حذف کد تخفیف" },
  { value: "admin.posts.create", label: "ایجاد مقاله" },
  { value: "admin.posts.update", label: "ویرایش مقاله" },
  { value: "admin.posts.delete", label: "حذف مقاله" },
  { value: "admin.media.upload", label: "آپلود رسانه" },
  { value: "admin.media.delete", label: "حذف رسانه" },
];

const entityOptions = [
  { value: "", label: "همه موجودیت‌ها" },
  { value: "product", label: "محصول" },
  { value: "order", label: "سفارش" },
  { value: "promo_code", label: "کد تخفیف" },
  { value: "post", label: "مقاله" },
  { value: "media", label: "رسانه" },
];

function faDate(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminAuditLogPanel() {
  const audit = useAdminAuditLogs();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const query = useMemo(
    () => ({
      ...(q.trim() ? { q: q.trim() } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: "500",
    }),
    [q, action, entityType, from, to]
  );

  useEffect(() => {
    if (audit.isAdmin) {
      void audit.load(query);
    }
  }, [audit, query]);

  if (!audit.isAdmin) {
    return (
      <div className="admin-orders-forbidden">
        <p className="text-ivory">فقط مدیران به این بخش دسترسی دارند.</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar">
        <TextBox label="جستجو" value={q} onChange={(e) => setQ(e.target.value)} />
        <SelectBox label="اقدام" value={action} options={actionOptions} onValueChange={setAction} />
        <SelectBox label="موجودیت" value={entityType} options={entityOptions} onValueChange={setEntityType} />
        <TextBox label="از تاریخ (ISO)" value={from} onChange={(e) => setFrom(e.target.value)} inputClassName="auth-input-ltr" />
        <TextBox label="تا تاریخ (ISO)" value={to} onChange={(e) => setTo(e.target.value)} inputClassName="auth-input-ltr" />
        <Button type="button" variant="outline" onClick={() => void audit.load(query)} disabled={audit.isLoading}>
          بروزرسانی
        </Button>
      </div>

      {audit.isLoading ? (
        <p className="text-silver">در حال بارگذاری لاگ‌ها…</p>
      ) : audit.logs.length === 0 ? (
        <p className="admin-orders-empty">لاگی ثبت نشده است.</p>
      ) : (
        <div className="admin-orders-list">
          {audit.logs.map((log) => (
            <article key={log.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-id">{log.action}</p>
                  <p className="admin-order-date">{faDate(log.at)}</p>
                  <p className="admin-order-customer">
                    {log.actorName ?? log.actorId}
                    {log.actorPhone ? ` · ${log.actorPhone}` : ""}
                  </p>
                </div>
                <span className="text-xs text-silver">{log.entityType ?? "-"}</span>
              </header>
              <p className="text-xs text-silver">{log.summary ?? log.route}</p>
              <p className="mt-1 font-mono text-[11px] text-silver" dir="ltr">
                {log.method} {log.route}
              </p>
              {log.entityId ? (
                <p className="font-mono text-[11px] text-silver" dir="ltr">
                  entityId: {log.entityId}
                </p>
              ) : null}
              {log.payload ? (
                <pre className="admin-audit-payload">{log.payload}</pre>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
