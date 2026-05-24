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

export type HomeKpiBucketDto = {
  label: string;
  value: number;
};

export type HomeStoneSalesDto = {
  stone: string;
  quantity: number;
  revenue: number;
};

export type AdminHomeKpiDto = {
  conversionRatePercent: number;
  averageBasketValue: number;
  successfulOrders: number;
  attemptedOrders: number;
  salesToday: number;
  salesWeek: number;
  salesMonth: number;
  dailySales: HomeKpiBucketDto[];
  weeklySales: HomeKpiBucketDto[];
  monthlySales: HomeKpiBucketDto[];
  stoneSales: HomeStoneSalesDto[];
};
