"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  accountSectionHref,
  isAccountAdminSectionId,
  parseAccountSection,
  type AccountNavSectionId,
} from "@/lib/account/sections";
import { AccountAdminSectionContent } from "@/components/account/AccountAdminSectionContent";
import { Compare, Heart, History, PenTool } from "@/components/icons";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageTransition } from "@/components/layout/PageTransition";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { OrderHistory } from "@/components/dashboard/OrderHistory";
import { QuoteRequestHistory } from "@/components/dashboard/QuoteRequestHistory";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import { useAccount } from "@/lib/hooks/useAccount";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountSidebarCard } from "@/components/account/AccountSidebarCard";
import { AccountNavMenu, type AccountNavGroup, type AccountNavItem } from "@/components/account/AccountNavMenu";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { AccountSectionContainer } from "@/components/account/AccountSectionContainer";
import { AccountOverviewPanel } from "@/components/account/AccountOverviewPanel";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountResourceRow } from "@/components/account/AccountResourceRow";
import { AccountReferralPanel } from "@/components/account/AccountReferralPanel";
import { AccountUgcPanel } from "@/components/account/AccountUgcPanel";

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { auth, orders, quoteRequests, wishlist, compareList, recentlyViewed, designs, comments } =
    useApp();
  const account = useAccount();
  const { products, isLoading: catalogLoading } = useCatalogProducts();
  const [activeSection, setActiveSection] = useState<AccountNavSectionId>("overview");

  const applySectionFromUrl = useCallback(() => {
    const section = parseAccountSection(
      window.location.hash,
      searchParams.get("section")
    );
    if (!section) return;
    setActiveSection(section);
    const href = accountSectionHref(section);
    if (`${window.location.pathname}${window.location.hash}` !== href) {
      window.history.replaceState(null, "", href);
    }
  }, [searchParams]);

  useEffect(() => {
    applySectionFromUrl();
    window.addEventListener("hashchange", applySectionFromUrl);
    return () => window.removeEventListener("hashchange", applySectionFromUrl);
  }, [applySectionFromUrl]);

  const wishlistedProducts = products.filter((p) => wishlist.isWishlisted(p.id));
  const compareProducts = useProductsByIds(compareList.ids);
  const recentlyViewedProducts = useProductsByIds(recentlyViewed.ids);
  const recentlyViewedBadge = catalogLoading
    ? recentlyViewed.ids.length
    : recentlyViewedProducts.length;
  const compareBadge = catalogLoading ? compareList.count : compareProducts.length;
  const activeUser = account.user ?? auth.user;
  const memberSince =
    activeUser?.memberSince
      ? new Date(activeUser.memberSince).toLocaleDateString("fa-IR", { year: "numeric" })
      : "—";

  const navigate = (id: string) => {
    const section = id as AccountNavSectionId;
    setActiveSection(section);
    window.history.replaceState(null, "", accountSectionHref(section));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navGroups = useMemo((): AccountNavGroup[] => {
    const accountItems: AccountNavItem[] = [
      { id: "overview", label: "خلاصه حساب" },
      { id: "referrals", label: fa.referral.navLabel },
      { id: "profile", label: "اطلاعات کاربری" },
      { id: "orders", label: fa.dashboard.purchaseHistory, badge: orders.orders.length },
      {
        id: "quotes",
        label: fa.dashboard.workshopQuotes,
        badge: quoteRequests.quotes.length,
      },
      { id: "ugc", label: fa.product.ugc.navLabel },
      { id: "wishlist", label: fa.dashboard.wishlist, badge: wishlistedProducts.length },
      { id: "compare", label: fa.dashboard.compareList, badge: compareBadge },
      {
        id: "recently-viewed",
        label: fa.dashboard.recentlyViewed,
        badge: recentlyViewedBadge,
      },
      { id: "designs", label: fa.dashboard.savedDesigns, badge: designs.designs.length },
    ];

    const adminItems: AccountNavItem[] = [];

    if (comments.canModerate) {
      adminItems.push({
        id: "admin-moderation",
        label: fa.admin.moderation.navLabel,
        badge: comments.pendingCount,
      });
    }

    if (auth.user?.role === "admin") {
      adminItems.push(
        { id: "admin-orders", label: fa.admin.orders.navLabel },
        { id: "admin-products", label: fa.admin.products.navLabel },
        { id: "admin-trade-in", label: fa.admin.tradeIn.navLabel },
        { id: "admin-promo-codes", label: fa.admin.promoCodes.navLabel },
        { id: "admin-home", label: fa.admin.home.navLabel },
        { id: "admin-posts", label: fa.admin.posts.navLabel },
        { id: "admin-gift-cards", label: fa.admin.giftCards.navLabel },
        {
          id: "admin-customizer-quotes",
          label: fa.customize.liveTimeline.admin.navLabel,
        }
      );
    } else if (auth.user?.role === "editor" || auth.user?.role === "reviewer") {
      adminItems.push({
        id: "admin-posts",
        label: fa.admin.posts.navLabel,
      });
    }

    const groups: AccountNavGroup[] = [
      { label: fa.dashboard.navSectionsLabel, items: accountItems },
    ];

    if (adminItems.length > 0) {
      groups.push({ label: fa.dashboard.navAdminLabel, items: adminItems });
    }

    return groups;
  }, [
    auth.user?.role,
    comments.canModerate,
    comments.pendingCount,
    designs.designs.length,
    orders.orders.length,
    quoteRequests.quotes.length,
    wishlistedProducts.length,
    compareBadge,
    recentlyViewedBadge,
  ]);

  const sectionContent = () => {
    if (isAccountAdminSectionId(activeSection)) {
      return <AccountAdminSectionContent section={activeSection} />;
    }

    if (activeSection === "profile" && account.user) {
      const profileUser = account.user;
      return (
        <AccountSectionContainer
          title="اطلاعات کاربری"
          subtitle="ویرایش مشخصات، آدرس و اطلاعات تماس"
        >
          <AccountProfileForm
            user={{
              name: profileUser.name,
              phone: profileUser.phone,
              firstName: profileUser.firstName,
              lastName: profileUser.lastName,
              birthDate: profileUser.birthDate,
              postalCode: profileUser.postalCode,
              addressLine: profileUser.addressLine,
              province: profileUser.province,
              city: profileUser.city,
              nationalCode: profileUser.nationalCode,
              landlinePhone: profileUser.landlinePhone,
              gender: profileUser.gender,
              favoriteStone: profileUser.favoriteStone,
              favoriteStyle: profileUser.favoriteStyle,
              favoriteBudgetBand: profileUser.favoriteBudgetBand,
            }}
            isSaving={account.isSaving}
            onSave={account.updateProfile}
          />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "referrals") {
      return (
        <AccountSectionContainer
          title={fa.referral.title}
          subtitle={fa.referral.subtitle}
        >
          <AccountReferralPanel referral={account.referral} />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "orders") {
      return (
        <AccountSectionContainer
          title={fa.dashboard.purchaseHistory}
          subtitle={fa.dashboard.ordersCount(orders.orders.length)}
          bodyVariant="flush"
        >
          <OrderHistory orders={orders.orders} isLoading={orders.isLoading} />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "quotes") {
      return (
        <AccountSectionContainer
          title={fa.dashboard.workshopQuotes}
          subtitle={fa.dashboard.workshopQuotesCount(quoteRequests.quotes.length)}
          bodyVariant="flush"
        >
          <QuoteRequestHistory
            quotes={quoteRequests.quotes}
            isLoading={quoteRequests.isLoading}
          />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "ugc") {
      return (
        <AccountSectionContainer
          title={fa.product.ugc.accountTitle}
          subtitle={fa.product.ugc.accountSubtitle}
        >
          <AccountUgcPanel />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "wishlist") {
      return (
        <AccountSectionContainer title={fa.dashboard.wishlist}>
          {wishlistedProducts.length === 0 ? (
            <AccountEmptyState
              icon={Heart}
              title={fa.dashboard.emptyWishlist}
              action={
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    {fa.dashboard.browseCollection}
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="account-resource-list">
              {wishlistedProducts.map((p) => (
                <li key={p.id}>
                  <AccountResourceRow
                    href={`/product/${p.id}`}
                    title={p.namePersian || p.name}
                    subtitle={p.collection}
                    price={p.price}
                    image={p.image}
                  />
                </li>
              ))}
            </ul>
          )}
        </AccountSectionContainer>
      );
    }

    if (activeSection === "compare") {
      return (
        <AccountSectionContainer title={fa.dashboard.compareList}>
          {catalogLoading && compareList.count > 0 ? (
            <div className="account-panel account-panel--loading" aria-busy="true">
              {Array.from({ length: Math.min(compareList.count, 4) }).map((_, i) => (
                <div key={i} className="account-skeleton account-skeleton--tile" />
              ))}
            </div>
          ) : compareProducts.length === 0 ? (
            <AccountEmptyState
              icon={Compare}
              title={fa.dashboard.emptyCompare}
              action={
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    {fa.dashboard.browseCollection}
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="account-section-actions">
                <Link href="/compare">
                  <Button size="sm">{fa.dashboard.viewCompare}</Button>
                </Link>
              </div>
              <ul className="account-resource-list">
                {compareProducts.map((p) => (
                  <li key={p.id}>
                    <AccountResourceRow
                      href={`/product/${p.id}`}
                      title={p.namePersian || p.name}
                      subtitle={p.collection}
                      price={p.price}
                      image={p.image}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </AccountSectionContainer>
      );
    }

    if (activeSection === "recently-viewed") {
      return (
        <AccountSectionContainer title={fa.dashboard.recentlyViewed}>
          {catalogLoading && recentlyViewed.ids.length > 0 ? (
            <div className="account-panel account-panel--loading" aria-busy="true">
              {Array.from({ length: Math.min(recentlyViewed.ids.length, 4) }).map((_, i) => (
                <div key={i} className="account-skeleton account-skeleton--tile" />
              ))}
            </div>
          ) : recentlyViewedProducts.length === 0 ? (
            <AccountEmptyState
              icon={History}
              title={fa.dashboard.emptyRecentlyViewed}
              action={
                <Link href="/shop">
                  <Button variant="outline" size="sm">
                    {fa.dashboard.browseCollection}
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="account-resource-list">
              {recentlyViewedProducts.map((p) => (
                <li key={p.id}>
                  <AccountResourceRow
                    href={`/product/${p.id}`}
                    title={p.namePersian || p.name}
                    subtitle={p.collection}
                    price={p.price}
                    image={p.image}
                  />
                </li>
              ))}
            </ul>
          )}
        </AccountSectionContainer>
      );
    }

    if (activeSection === "designs") {
      return (
        <AccountSectionContainer title={fa.dashboard.savedDesigns}>
          {designs.designs.length === 0 ? (
            <AccountEmptyState
              icon={PenTool}
              title={fa.dashboard.noDesigns}
              description="طرح‌های سفارشی‌سازی‌شده در اینجا ذخیره می‌شوند."
              action={
                <Link href="/customize">
                  <Button variant="outline" size="sm">
                    شروع سفارشی‌سازی
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="account-resource-list">
              {designs.designs.map((design) => (
                <li key={design.id}>
                  <div className="account-design-row">
                    <AccountResourceRow
                      title={design.name}
                      subtitle={new Date(design.createdAt).toLocaleDateString("fa-IR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      price={design.price}
                      trailing={
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => designs.removeDesign(design.id)}
                        >
                          {fa.common.remove}
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AccountSectionContainer>
      );
    }

    return (
      <AccountSectionContainer>
        {account.stats ? (
          <AccountOverviewPanel stats={account.stats} loyalty={account.loyalty} onNavigate={navigate} />
        ) : (
          <div className="account-panel account-panel--loading" aria-busy="true">
            <div className="account-skeleton account-skeleton--hero" />
            <div className="account-stat-grid">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="account-skeleton account-skeleton--tile" />
              ))}
            </div>
          </div>
        )}
      </AccountSectionContainer>
    );
  };

  return (
    <AuthGuard redirectTo="/account">
      <PageTransition>
        <div className="account-page pb-24 pt-6 md:pt-8">
          <div className="site-container">
            <AccountShell
              sidebar={
                <div className="account-sidebar-stack">
                  {activeUser ? (
                    <AccountSidebarCard
                      user={{
                        name: activeUser.name,
                        phone: activeUser.phone,
                        firstName: activeUser.firstName,
                        lastName: activeUser.lastName,
                        tier: activeUser.tier ?? "royal",
                        loyaltyTier: activeUser.loyaltyTier ?? "bronze",
                        role: activeUser.role ?? "user",
                        memberSince,
                      }}
                    />
                  ) : null}
                  <AccountNavMenu
                    groups={navGroups}
                    activeId={activeSection}
                    onChange={navigate}
                  />
                </div>
              }
            >
              {sectionContent()}
            </AccountShell>
          </div>
        </div>
      </PageTransition>
    </AuthGuard>
  );
}
