import { Cormorant_Garamond, Vazirmatn } from "next/font/google";
import "@/styles/globals.css";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import "@/styles/swiper-preinit.css";
import { rootSiteMetadata, rootSiteViewport } from "@/lib/seo/site";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structured-data";
import { getPublicSiteSettings } from "@/lib/server/site-settings/site-settings";
import { getHomeBannerSettings } from "@/lib/server/home/home-banner";
import { isHeaderStripVisible } from "@/lib/home-banner-header-strip";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { HomeBannerProvider } from "@/components/providers/HomeBannerProvider";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { AppProvider } from "@/lib/context/AppContext";
import { ConditionalLayoutChrome } from "@/components/layout/ConditionalLayoutChrome";
import { AppToaster } from "@/components/ui/AppToaster";
import { PersianDigitsEnforcer } from "@/components/providers/PersianDigitsEnforcer";
import { ClientObservability } from "@/components/providers/ClientObservability";
import { DiscountCountdownProvider } from "@/components/providers/DiscountCountdownProvider";
import { MotionOffProvider } from "@/components/providers/MotionOffProvider";
import { cn } from "@/lib/utils";
import iranYekanFont from "@/fonts/iranYekanFont";
import iranYekanFontNum from "@/fonts/iranYekanFontNum";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display-latin",
  weight: ["300", "400", "500", "600"],
  display: "swap",
  adjustFontFallback: true,
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
});

export const viewport = rootSiteViewport;

export async function generateMetadata() {
  const settings = await getPublicSiteSettings();
  return rootSiteMetadata(settings);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, banner] = await Promise.all([
    getPublicSiteSettings(),
    getHomeBannerSettings(),
  ]);
  const hasPromo = isHeaderStripVisible(banner);
  const promoIsImage = hasPromo && banner.headerStripMode === "image";
  const orgJsonLd = buildOrganizationJsonLd({
    brandName: siteSettings.brandName,
    logoUrl: siteSettings.logoUrl,
    social: siteSettings.social,
    contactPhone: siteSettings.contactPhone,
  });
  const webSiteJsonLd = buildWebSiteJsonLd({ brandName: siteSettings.brandName });
  // PROVIDER ORDER: Redux store -> App domain context -> global chrome/widgets.
  return (
    <html
      lang="fa"
      dir="rtl"
      suppressHydrationWarning
      className={cn(
        cormorant.variable,
        vazirmatn.variable,
        iranYekanFont.variable,
        iranYekanFontNum.variable,
        hasPromo && "header-promo-active",
        promoIsImage && "header-promo-active--image"
      )}
    >
      <body className="font-IranYekanFontNum" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([orgJsonLd, webSiteJsonLd]) }}
        />
        <MotionOffProvider>
          <StoreProvider>
            <AppProvider>
              <SiteSettingsProvider settings={siteSettings}>
                <HomeBannerProvider initialBanner={banner}>
                  <DiscountCountdownProvider>
                    <ConditionalLayoutChrome>{children}</ConditionalLayoutChrome>
                    <AppToaster />
                    <PersianDigitsEnforcer />
                    <ClientObservability />
                  </DiscountCountdownProvider>
                </HomeBannerProvider>
              </SiteSettingsProvider>
            </AppProvider>
          </StoreProvider>
        </MotionOffProvider>
      </body>
    </html>
  );
}
