import { Cormorant_Garamond, Vazirmatn } from "next/font/google";
import type { Viewport } from "next";
import "@/styles/globals.css";
import { rootSiteMetadata } from "@/lib/seo/site";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { AppProvider } from "@/lib/context/AppContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConditionalLayoutChrome } from "@/components/layout/ConditionalLayoutChrome";
import { AppToaster } from "@/components/ui/AppToaster";
import { PersianDigitsEnforcer } from "@/components/providers/PersianDigitsEnforcer";
import { ClientObservability } from "@/components/providers/ClientObservability";
import { MotionOffProvider } from "@/components/providers/MotionOffProvider";
import iranYekanFont from "@/fonts/iranYekanFont";
import iranYekanFontNum from "@/fonts/iranYekanFontNum";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display-latin",
  weight: ["300", "400", "500", "600"],
});

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = rootSiteMetadata();

// Vercel Web Interface Guidelines: theme-color matches page background
export const viewport: Viewport = {
  themeColor: "#FAF8F5",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // PROVIDER ORDER: Redux store -> App domain context -> global chrome/widgets.
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${cormorant.variable} ${vazirmatn.variable} ${iranYekanFont.variable} ${iranYekanFontNum.variable}`}
    >
      <body className="font-IranYekanFontNum">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[999] focus:rounded-heritage focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
        >
          رفتن به محتوای اصلی
        </a>
        <MotionOffProvider>
          <StoreProvider>
            <AppProvider>
              <ConditionalLayoutChrome>{children}</ConditionalLayoutChrome>
              <AppToaster />
              <PersianDigitsEnforcer />
              <ClientObservability />
            </AppProvider>
          </StoreProvider>
        </MotionOffProvider>
      </body>
    </html>
  );
}
