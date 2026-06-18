import dynamic from "next/dynamic";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { HomeDataProvider } from "@/lib/context/HomeDataContext";
import { getHomePageData } from "@/lib/server/home/get-home-page-data";

const HomeProductBannerSlider = dynamic(
  () => import("@/components/sections/HomeProductBannerSlider").then((mod) => mod.HomeProductBannerSlider)
);
const HomeQuickLinks = dynamic(
  () => import("@/components/sections/HomeQuickLinks").then((mod) => mod.HomeQuickLinks)
);
const BestSellers = dynamic(() => import("@/components/sections/BestSellers").then((mod) => mod.BestSellers));
const PopularArtisans = dynamic(
  () => import("@/components/sections/PopularArtisans").then((mod) => mod.PopularArtisans)
);
const HomeReadings = dynamic(
  () => import("@/components/sections/HomeReadings").then((mod) => mod.HomeReadings)
);
const Testimonials = dynamic(() => import("@/components/sections/Testimonials").then((mod) => mod.Testimonials));

export default async function HomePage() {
  const initialHomeData = await getHomePageData();

  return (
    <HomeDataProvider initialData={initialHomeData}>
      <HomeProductBannerSlider />
      <HomeQuickLinks />
      <div className="site-shell min-h-0">
        <main className="home-page">
          <SalesTrustStrip variant="dense" />
          <BestSellers />
          <PopularArtisans />
          <HomeReadings />
          <Testimonials />
        </main>
      </div>
    </HomeDataProvider>
  );
}
