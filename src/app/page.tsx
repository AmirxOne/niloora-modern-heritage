import dynamic from "next/dynamic";
import { HeroSection } from "@/components/sections/HeroSection";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { HomeDataProvider } from "@/lib/context/HomeDataContext";
import { getHomePageData } from "@/lib/server/home/get-home-page-data";

const HomeProductBannerSlider = dynamic(
  () => import("@/components/sections/HomeProductBannerSlider").then((mod) => mod.HomeProductBannerSlider)
);
const HomePersonalizedRecommendations = dynamic(
  () =>
    import("@/components/sections/HomePersonalizedRecommendations").then(
      (mod) => mod.HomePersonalizedRecommendations
    )
);
const FeaturedCollections = dynamic(
  () => import("@/components/sections/FeaturedCollections").then((mod) => mod.FeaturedCollections)
);
const BestSellers = dynamic(() => import("@/components/sections/BestSellers").then((mod) => mod.BestSellers));
const CustomizerCTA = dynamic(() => import("@/components/sections/CustomizerCTA").then((mod) => mod.CustomizerCTA));
const BrandStory = dynamic(() => import("@/components/sections/BrandStory").then((mod) => mod.BrandStory));
const Testimonials = dynamic(() => import("@/components/sections/Testimonials").then((mod) => mod.Testimonials));
const InstagramGallery = dynamic(
  () => import("@/components/sections/InstagramGallery").then((mod) => mod.InstagramGallery)
);

export default async function HomePage() {
  const initialHomeData = await getHomePageData();

  return (
    <HomeDataProvider initialData={initialHomeData}>
      <HeroSection />
      <div className="site-shell min-h-0">
        <main className="home-page">
          <SalesTrustStrip variant="dense" />
          <HomeProductBannerSlider />
          <HomePersonalizedRecommendations />
          <FeaturedCollections />
          <BestSellers />
          <CustomizerCTA />
          <BrandStory />
          <Testimonials />
          <InstagramGallery />
        </main>
      </div>
    </HomeDataProvider>
  );
}
