export type HomeBannerHeaderStripMode = "text" | "image";

export type HomeBannerDto = {
  enabled: boolean;
  badge: string;
  title: string;
  subtitle: string;
  percent: number;
  countdownEnabled: boolean;
  countdownEndsAt: string | null;
  ctaLabel: string | null;
  ctaHref: string;
  headerStripEnabled: boolean;
  headerStripMode: HomeBannerHeaderStripMode;
  headerStripImageUrl: string | null;
  headerStripBadge: string;
  headerStripTitle: string;
  headerStripSubtitle: string;
  headerStripCtaLabel: string | null;
  headerStripCtaHref: string;
};

export type HomeSliderItemDto = {
  id: string;
  productId: string;
  sortOrder: number;
  active: boolean;
  productName?: string;
  productImage?: string;
};

export type HomeTestimonialDto = {
  id: string;
  name: string;
  location: string;
  text: string;
  rating: number;
  sortOrder: number;
};

export type HomeInstagramPostDto = {
  id: string;
  image: string;
  likes: number;
  sortOrder: number;
};

export type { AdminHomeKpiDto, HomeKpiBucketDto, HomeStoneSalesDto } from "@/lib/types";
