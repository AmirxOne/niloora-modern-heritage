"use client";

import { AdminCustomizerQuotesPanel } from "@/components/admin/AdminCustomizerQuotesPanel";
import { AdminGiftCardsPanel } from "@/components/admin/AdminGiftCardsPanel";
import { AdminHomeContentPanel } from "@/components/admin/AdminHomeContentPanel";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import { AdminPostsPanel } from "@/components/admin/AdminPostsPanel";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { AdminPromoCodesPanel } from "@/components/admin/AdminPromoCodesPanel";
import { AdminTradeInPanel } from "@/components/admin/AdminTradeInPanel";
import { AccountSectionContainer } from "@/components/account/AccountSectionContainer";
import { CommentModeration } from "@/components/dashboard/CommentModeration";
import { ProductQuestionsModeration } from "@/components/dashboard/ProductQuestionsModeration";
import { UgcModeration } from "@/components/dashboard/UgcModeration";
import type { AccountAdminSectionId } from "@/lib/account/sections";
import { fa } from "@/lib/i18n/fa";

export function AccountAdminSectionContent({ section }: { section: AccountAdminSectionId }) {
  switch (section) {
    case "admin-moderation":
      return (
        <AccountSectionContainer
          title={fa.admin.moderation.title}
          subtitle={fa.admin.moderation.subtitle}
          bodyVariant="flush"
        >
          <div className="account-admin-stack">
            <CommentModeration />
            <ProductQuestionsModeration />
            <UgcModeration />
          </div>
        </AccountSectionContainer>
      );
    case "admin-orders":
      return (
        <AccountSectionContainer
          title={fa.admin.orders.title}
          subtitle={fa.admin.orders.subtitle}
          bodyVariant="flush"
        >
          <AdminOrdersPanel />
        </AccountSectionContainer>
      );
    case "admin-products":
      return (
        <AccountSectionContainer
          title={fa.admin.products.title}
          subtitle={fa.admin.products.subtitle}
          bodyVariant="flush"
        >
          <AdminProductsPanel />
        </AccountSectionContainer>
      );
    case "admin-trade-in":
      return (
        <AccountSectionContainer
          title={fa.admin.tradeIn.title}
          subtitle={fa.admin.tradeIn.subtitle}
          bodyVariant="flush"
        >
          <AdminTradeInPanel />
        </AccountSectionContainer>
      );
    case "admin-promo-codes":
      return (
        <AccountSectionContainer
          title={fa.admin.promoCodes.title}
          subtitle={fa.admin.promoCodes.subtitle}
          bodyVariant="flush"
        >
          <AdminPromoCodesPanel />
        </AccountSectionContainer>
      );
    case "admin-home":
      return (
        <AccountSectionContainer
          title={fa.admin.home.title}
          subtitle={fa.admin.home.subtitle}
          bodyVariant="flush"
        >
          <AdminHomeContentPanel />
        </AccountSectionContainer>
      );
    case "admin-posts":
      return (
        <AccountSectionContainer
          title={fa.admin.posts.title}
          subtitle={fa.admin.posts.subtitle}
          bodyVariant="flush"
        >
          <AdminPostsPanel />
        </AccountSectionContainer>
      );
    case "admin-gift-cards":
      return (
        <AccountSectionContainer
          title={fa.admin.giftCards.title}
          subtitle={fa.admin.giftCards.subtitle}
          bodyVariant="flush"
        >
          <AdminGiftCardsPanel />
        </AccountSectionContainer>
      );
    case "admin-customizer-quotes":
      return (
        <AccountSectionContainer
          title={fa.customize.liveTimeline.admin.title}
          subtitle={fa.customize.liveTimeline.admin.subtitle}
          bodyVariant="flush"
          className="account-admin-customizer"
        >
          <AdminCustomizerQuotesPanel />
        </AccountSectionContainer>
      );
    default:
      return null;
  }
}
