import { HeroSection } from "@/components/sections/HeroSection";
import { SalesTrustStrip } from "@/components/commerce/SalesTrustStrip";
import { HomePromoStrip } from "@/components/sections/HomePromoStrip";
import { HomeProductBannerSlider } from "@/components/sections/HomeProductBannerSlider";
import { FeaturedCollections } from "@/components/sections/FeaturedCollections";
import { BestSellers } from "@/components/sections/BestSellers";
import { CustomizerCTA } from "@/components/sections/CustomizerCTA";
import { BrandStory } from "@/components/sections/BrandStory";
import { Testimonials } from "@/components/sections/Testimonials";
import { InstagramGallery } from "@/components/sections/InstagramGallery";
import { HomeDataProvider } from "@/lib/context/HomeDataContext";

export default function HomePage() {
  return (
    <HomeDataProvider>
      <HeroSection />
      <SalesTrustStrip variant="dense" />
      <HomePromoStrip />
      <HomeProductBannerSlider />
      <FeaturedCollections />
      <BestSellers />
      <CustomizerCTA />
      <BrandStory />
      <Testimonials />
      <InstagramGallery />
    </HomeDataProvider>
  );
}
