"use client";

import { useEffect, useState } from "react";
import { useAdminSiteSettings } from "@/lib/hooks/useAdminSiteSettings";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { TextAreaBox, TextBox } from "@/components/inputs";
import { LoadingState } from "@/components/ui/loading/LoadingState";

const t = fa.admin.settings;

export function AdminSettingsPanel() {
  const admin = useAdminSiteSettings();
  const [form, setForm] = useState({
    brandName: "",
    brandTagline: "",
    shortDescription: "",
    logoUrl: "",
    contactPhone: "",
    contactPhoneSecondary: "",
    socialInstagram: "",
    socialBale: "",
    socialEita: "",
    socialTelegram: "",
    socialWhatsapp: "",
    socialTwitter: "",
    socialYoutube: "",
    seoTitle: "",
    seoDescription: "",
    seoOgImageUrl: "",
    paymentGatewayEnabled: true,
    zarinpalMerchantId: "",
    zarinpalSandbox: true,
    smsEnabled: true,
  });

  useEffect(() => {
    if (admin.isAdmin) void admin.loadSettings();
  }, [admin.isAdmin]);

  useEffect(() => {
    if (!admin.settings) return;
    const s = admin.settings;
    setForm({
      brandName: s.brandName,
      brandTagline: s.brandTagline,
      shortDescription: s.shortDescription ?? "",
      logoUrl: s.logoUrl ?? "",
      contactPhone: s.contactPhone ?? "",
      contactPhoneSecondary: s.contactPhoneSecondary ?? "",
      socialInstagram: s.social.instagram ?? "",
      socialBale: s.social.bale ?? "",
      socialEita: s.social.eita ?? "",
      socialTelegram: s.social.telegram ?? "",
      socialWhatsapp: s.social.whatsapp ?? "",
      socialTwitter: s.social.twitter ?? "",
      socialYoutube: s.social.youtube ?? "",
      seoTitle: s.seo.title,
      seoDescription: s.seo.description,
      seoOgImageUrl: s.seo.ogImageUrl,
      paymentGatewayEnabled: s.payment.enabled,
      zarinpalMerchantId: s.payment.zarinpalMerchantId ?? "",
      zarinpalSandbox: s.payment.zarinpalSandbox,
      smsEnabled: s.sms.enabled,
    });
  }, [admin.settings]);

  if (!admin.allowed) return null;

  const save = () =>
    void admin.saveSettings({
      brandName: form.brandName,
      brandTagline: form.brandTagline,
      shortDescription: form.shortDescription || null,
      logoUrl: form.logoUrl || null,
      contactPhone: form.contactPhone || null,
      contactPhoneSecondary: form.contactPhoneSecondary || null,
      socialInstagram: form.socialInstagram || null,
      socialBale: form.socialBale || null,
      socialEita: form.socialEita || null,
      socialTelegram: form.socialTelegram || null,
      socialWhatsapp: form.socialWhatsapp || null,
      socialTwitter: form.socialTwitter || null,
      socialYoutube: form.socialYoutube || null,
      seoTitle: form.seoTitle || null,
      seoDescription: form.seoDescription || null,
      seoOgImageUrl: form.seoOgImageUrl || null,
      paymentGatewayEnabled: form.paymentGatewayEnabled,
      zarinpalMerchantId: form.zarinpalMerchantId || null,
      zarinpalSandbox: form.zarinpalSandbox,
      smsEnabled: form.smsEnabled,
    });

  return (
    <div className="admin-settings-panel space-y-8">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" disabled={admin.isLoading} onClick={() => void admin.loadSettings()}>
          {t.refresh}
        </Button>
        <Button type="button" disabled={admin.isSaving || admin.isLoading} onClick={save}>
          {admin.isSaving ? t.saving : t.save}
        </Button>
      </div>

      {admin.isLoading && !admin.settings ? (
        <LoadingState variant="admin-form" />
      ) : (
        <>
          <section className="admin-finance-detail-section space-y-4">
            <h2 className="admin-finance-section-title">{t.brandSection}</h2>
            <TextBox label={t.brandName} value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
            <TextBox label={t.brandTagline} value={form.brandTagline} onChange={(e) => setForm({ ...form, brandTagline: e.target.value })} />
            <TextAreaBox label={t.shortDescription} id="settings-short-desc" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
            <TextBox label={t.logoUrl} value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} inputClassName="auth-input-ltr" placeholder="/brand-mark.png" />
          </section>

          <section className="admin-finance-detail-section space-y-4">
            <h2 className="admin-finance-section-title">{t.contactSection}</h2>
            <TextBox label={t.contactPhone} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <TextBox label={t.contactPhoneSecondary} value={form.contactPhoneSecondary} onChange={(e) => setForm({ ...form, contactPhoneSecondary: e.target.value })} />
          </section>

          <section className="admin-finance-detail-section space-y-4">
            <h2 className="admin-finance-section-title">{t.socialSection}</h2>
            <TextBox label={t.socialInstagram} value={form.socialInstagram} onChange={(e) => setForm({ ...form, socialInstagram: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialBale} value={form.socialBale} onChange={(e) => setForm({ ...form, socialBale: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialEita} value={form.socialEita} onChange={(e) => setForm({ ...form, socialEita: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialTelegram} value={form.socialTelegram} onChange={(e) => setForm({ ...form, socialTelegram: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialWhatsapp} value={form.socialWhatsapp} onChange={(e) => setForm({ ...form, socialWhatsapp: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialTwitter} value={form.socialTwitter} onChange={(e) => setForm({ ...form, socialTwitter: e.target.value })} inputClassName="auth-input-ltr" />
            <TextBox label={t.socialYoutube} value={form.socialYoutube} onChange={(e) => setForm({ ...form, socialYoutube: e.target.value })} inputClassName="auth-input-ltr" />
          </section>

          <section className="admin-finance-detail-section space-y-4">
            <h2 className="admin-finance-section-title">{t.seoSection}</h2>
            <TextBox label={t.seoTitle} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
            <TextAreaBox label={t.seoDescription} id="settings-seo-desc" value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
            <TextBox label={t.seoOgImage} value={form.seoOgImageUrl} onChange={(e) => setForm({ ...form, seoOgImageUrl: e.target.value })} inputClassName="auth-input-ltr" />
          </section>

          <section className="admin-finance-detail-section space-y-4">
            <h2 className="admin-finance-section-title">{t.servicesSection}</h2>
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input
                type="checkbox"
                checked={form.paymentGatewayEnabled}
                onChange={(e) => setForm({ ...form, paymentGatewayEnabled: e.target.checked })}
              />
              {t.paymentEnabled}
            </label>
            <TextBox label={t.zarinpalMerchantId} value={form.zarinpalMerchantId} onChange={(e) => setForm({ ...form, zarinpalMerchantId: e.target.value })} inputClassName="auth-input-ltr" />
            {admin.settings?.payment.merchantFromEnv ? (
              <p className="text-xs text-silver">{t.merchantFromEnvHint}</p>
            ) : null}
            <p className="text-xs text-silver">
              {admin.settings?.services.paymentGateway.configured
                ? t.serviceConfigured
                : t.serviceNotConfigured}
            </p>
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input
                type="checkbox"
                checked={form.zarinpalSandbox}
                onChange={(e) => setForm({ ...form, zarinpalSandbox: e.target.checked })}
              />
              {t.zarinpalSandbox}
            </label>
            <label className="flex items-center gap-2 text-sm text-ivory">
              <input
                type="checkbox"
                checked={form.smsEnabled}
                onChange={(e) => setForm({ ...form, smsEnabled: e.target.checked })}
              />
              {t.smsEnabled}
            </label>
            {admin.settings?.sms.apiKeyFromEnv ? (
              <p className="text-xs text-silver">{t.smsFromEnvHint}</p>
            ) : null}
            <p className="text-xs text-silver">
              {admin.settings?.services.sms.configured ? t.serviceConfigured : t.serviceNotConfigured}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
