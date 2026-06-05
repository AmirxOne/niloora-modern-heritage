"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_AUDIT_ACTION_KEYS,
  ADMIN_AUDIT_ENTITY_KEYS,
} from "@/lib/admin/audit-log-catalog";
import { useAdminAuditLogs } from "@/lib/hooks/useAdminAuditLogs";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { SelectBox, TextBox } from "@/components/inputs";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.auditLogs;
const actionLabels = t.actions as Record<string, string>;
const entityLabels = t.entities as Record<string, string>;

const actionOptions = [
  { value: "", label: t.filterAllActions },
  ...ADMIN_AUDIT_ACTION_KEYS.map((value) => ({
    value,
    label: actionLabels[value] ?? value,
  })),
];

const entityOptions = [
  { value: "", label: t.filterAllEntities },
  ...ADMIN_AUDIT_ENTITY_KEYS.map((value) => ({
    value,
    label: entityLabels[value] ?? value,
  })),
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
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQ(qInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [qInput]);

  const query = useMemo(
    () => ({
      ...(q ? { q } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      limit: "500",
    }),
    [q, action, entityType, from, to]
  );

  useEffect(() => {
    if (!audit.isAdmin) return;
    void audit.load(query);
  }, [audit.isAdmin, audit.load, query]);

  if (!audit.allowed) return null;

  return (
    <div className="admin-orders-panel">
      <div className="admin-orders-toolbar flex-wrap">
        <TextBox
          label={t.filterQ}
          value={qInput}
          onChange={(event) => setQInput(event.target.value)}
          placeholder={t.filterQPlaceholder}
        />
        <SelectBox
          label={t.filterAction}
          value={action}
          options={actionOptions}
          onValueChange={setAction}
        />
        <SelectBox
          label={t.filterEntity}
          value={entityType}
          options={entityOptions}
          onValueChange={setEntityType}
        />
        <TextBox
          label={t.filterFrom}
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          inputClassName="auth-input-ltr"
          placeholder="2026-06-01T00:00:00.000Z"
        />
        <TextBox
          label={t.filterTo}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          inputClassName="auth-input-ltr"
          placeholder="2026-06-30T23:59:59.999Z"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void audit.load(query)}
          disabled={audit.isLoading}
        >
          {t.refresh}
        </Button>
      </div>

      {audit.total > 0 ? (
        <p className="admin-audit-result-count">{t.resultCount(audit.logs.length, audit.total)}</p>
      ) : null}

      {audit.isLoading ? (
        <LoadingState variant="admin-cards" count={4} />
      ) : audit.logs.length === 0 ? (
        <p className="admin-orders-empty">{t.empty}</p>
      ) : (
        <div className="admin-orders-list">
          {audit.logs.map((log) => (
            <article key={log.id} className="admin-order-card">
              <header className="admin-order-card-header">
                <div>
                  <p className="admin-order-id">
                    {actionLabels[log.action] ?? log.action}
                  </p>
                  <p className="admin-order-date">{faDate(log.at)}</p>
                  <p className="admin-order-customer">
                    {log.actorName ?? log.actorId}
                    {log.actorPhone ? ` · ${log.actorPhone}` : ""}
                    {log.actorRole ? ` · ${log.actorRole}` : ""}
                  </p>
                </div>
                <span className="text-xs text-silver">
                  {log.entityType ? (entityLabels[log.entityType] ?? log.entityType) : "—"}
                </span>
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
              {log.ip ? (
                <p className="font-mono text-[11px] text-silver" dir="ltr">
                  ip: {log.ip}
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
