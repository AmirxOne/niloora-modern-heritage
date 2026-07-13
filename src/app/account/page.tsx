"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  accountSectionHref,
  parseAccountSection,
  type AccountNavSectionId,
} from "@/lib/account/sections";
import { canAccessAdminArea, resolveLegacyAdminRedirect } from "@/lib/admin/navigation";
import { Compare, Heart, History, PenTool } from "@/components/icons";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageTransition } from "@/components/layout/PageTransition";
import { useApp } from "@/lib/context/AppContext";
import { getProductDisplayName } from "@/lib/products/product-display-name";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { OrderHistory } from "@/components/account/OrderHistory";
import { QuoteRequestHistory } from "@/components/account/QuoteRequestHistory";
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

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, orders, quoteRequests, wishlist, compareList, recentlyViewed, designs } = useApp();
  const account = useAccount();
  const { products, isLoading: catalogLoading } = useCatalogProducts();
  const [activeSection, setActiveSection] = useState<AccountNavSectionId>("overview");

  const applySectionFromUrl = useCallback(() => {
    const legacyRedirect = resolveLegacyAdminRedirect(
      window.location.hash,
      searchParams.get("section")
    );
    if (legacyRedirect) {
      router.replace(legacyRedirect);
      return;
    }

    const section = parseAccountSection(window.location.hash, searchParams.get("section"));
    if (!section) return;
    setActiveSection(section);
    const href = accountSectionHref(section);
    if (`${window.location.pathname}${window.location.hash}` !== href) {
      window.history.replaceState(null, "", href);
    }
  }, [router, searchParams]);

  useEffect(() => {
    applySectionFromUrl();
    window.addEventListener("hashchange", applySectionFromUrl);
    return () => window.removeEventListener("hashchange", applySectionFromUrl);
  }, [applySectionFromUrl]);

  const wishlistedProducts = products.filter((p) => wishlist.isWishlisted(p.id));
  const { products: compareProducts } = useProductsByIds(compareList.ids);
  const { products: recentlyViewedProducts } = useProductsByIds(recentlyViewed.ids);
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
      { id: "wishlist", label: fa.dashboard.wishlist, badge: wishlistedProducts.length },
      { id: "compare", label: fa.dashboard.compareList, badge: compareBadge },
      {
        id: "recently-viewed",
        label: fa.dashboard.recentlyViewed,
        badge: recentlyViewedBadge,
      },
      { id: "designs", label: fa.dashboard.savedDesigns, badge: designs.designs.length },
    ];

    return [{ label: fa.dashboard.navSectionsLabel, items: accountItems }];
  }, [
    designs.designs.length,
    orders.orders.length,
    quoteRequests.quotes.length,
    wishlistedProducts.length,
    compareBadge,
    recentlyViewedBadge,
  ]);

  const sectionContent = () => {
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
                    title={getProductDisplayName(p)}
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
                      title={getProductDisplayName(p)}
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
                    title={getProductDisplayName(p)}
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
                  {canAccessAdminArea(auth.user?.role) ? (
                    <Link href="/admin" className="account-admin-portal-link">
                      {fa.admin.panelNavLabel}
                    </Link>
                  ) : null}
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
