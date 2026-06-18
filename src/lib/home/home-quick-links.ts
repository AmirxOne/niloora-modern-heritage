import type { IconComponent } from "@/lib/icons";
import {
  Crown,
  Gem,
  Hammer,
  Menu,
  PenTool,
  Recycle,
  ScanEye,
  Store,
  Verify,
} from "@/components/icons";
import { fa } from "@/lib/i18n/fa";

export type HomeQuickLink = {
  id: string;
  href: string;
  label: string;
  Icon: IconComponent;
};

export const HOME_QUICK_LINKS: HomeQuickLink[] = [
  {
    id: "shop",
    href: "/shop",
    label: fa.home.quickLinks.shop,
    Icon: Store,
  },
  {
    id: "royal-heritage",
    href: "/shop?collection=royal-heritage",
    label: fa.footer.royalHeritage,
    Icon: Crown,
  },
  {
    id: "customize",
    href: "/customize",
    label: fa.nav.customize,
    Icon: PenTool,
  },
  {
    id: "pre-owned",
    href: "/pre-owned",
    label: fa.nav.preOwned,
    Icon: Recycle,
  },
  {
    id: "artisans",
    href: "/artisans",
    label: fa.footer.artisans,
    Icon: Hammer,
  },
  {
    id: "stones",
    href: "/stones",
    label: fa.home.quickLinks.stones,
    Icon: Gem,
  },
  {
    id: "verify",
    href: "/verify",
    label: fa.home.quickLinks.authenticity,
    Icon: Verify,
  },
  {
    id: "workshop",
    href: "/workshop-transparency",
    label: fa.home.quickLinks.workshop,
    Icon: ScanEye,
  },
];

export const HOME_QUICK_LINK_MORE: HomeQuickLink = {
  id: "more",
  href: "/about",
  label: fa.home.quickLinks.more,
  Icon: Menu,
};
