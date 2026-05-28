export type SiteSocialLinks = {
  instagram: string | null;
  bale: string | null;
  eita: string | null;
  telegram: string | null;
  whatsapp: string | null;
  twitter: string | null;
  youtube: string | null;
};

export type PublicSiteSettings = {
  brandName: string;
  brandTagline: string;
  shortDescription: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactPhoneSecondary: string | null;
  social: SiteSocialLinks;
  seo: {
    title: string;
    description: string;
    ogImageUrl: string;
  };
  services: {
    paymentGateway: { enabled: boolean; provider: string; configured: boolean };
    sms: { enabled: boolean; provider: string; configured: boolean };
  };
};

export type AdminSiteSettings = PublicSiteSettings & {
  payment: {
    enabled: boolean;
    provider: string;
    zarinpalMerchantId: string | null;
    zarinpalSandbox: boolean;
    merchantFromEnv: boolean;
  };
  sms: {
    enabled: boolean;
    provider: string;
    apiKeyFromEnv: boolean;
  };
  updatedAt: string;
};
