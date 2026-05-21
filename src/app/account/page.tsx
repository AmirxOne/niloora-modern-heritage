"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  accountSectionHref,
  parseAccountSection,
  type AccountSectionId,
} from "@/lib/account/sections";
import { Compare, Heart, History, PenTool } from "@/components/icons";
import { useProductsByIds } from "@/lib/hooks/useProductsByIds";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { PageTransition } from "@/components/layout/PageTransition";
import { useApp } from "@/lib/context/AppContext";
import { fa } from "@/lib/i18n/fa";
import { Button } from "@/components/ui/Button";
import { OrderHistory } from "@/components/dashboard/OrderHistory";
import { QuoteRequestHistory } from "@/components/dashboard/QuoteRequestHistory";
import { CommentModeration } from "@/components/dashboard/CommentModeration";
import { useCatalogProducts } from "@/lib/hooks/useCatalogProducts";
import { useAccount } from "@/lib/hooks/useAccount";
import { AccountShell } from "@/components/account/AccountShell";
import { AccountSidebarCard } from "@/components/account/AccountSidebarCard";
import { AccountNavMenu, type AccountNavItem } from "@/components/account/AccountNavMenu";
import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { AccountSectionContainer } from "@/components/account/AccountSectionContainer";
import { AccountOverviewPanel } from "@/components/account/AccountOverviewPanel";
import { AccountEmptyState } from "@/components/account/AccountEmptyState";
import { AccountResourceRow } from "@/components/account/AccountResourceRow";

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, orders, quoteRequests, wishlist, compareList, recentlyViewed, designs, comments } =
    useApp();
  const account = useAccount();
  const { products } = useCatalogProducts();
  const [activeSection, setActiveSection] = useState<AccountSectionId>("overview");

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
  const activeUser = account.user ?? auth.user;
  const memberSince =
    activeUser?.memberSince
      ? new Date(activeUser.memberSince).toLocaleDateString("fa-IR", { year: "numeric" })
      : "—";

  const navigate = (id: string) => {
    if (id === "admin-orders") {
      router.push("/admin/orders");
      return;
    }
    if (id === "admin-products") {
      router.push("/admin/products");
      return;
    }
    if (id === "admin-trade-in") {
      router.push("/admin/trade-in");
      return;
    }
    if (id === "admin-promo-codes") {
      router.push("/admin/promo-codes");
      return;
    }
    if (id === "admin-home") {
      router.push("/admin/home");
      return;
    }
    if (id === "admin-posts") {
      router.push("/admin/posts");
      return;
    }
    const section = id as AccountSectionId;
    setActiveSection(section);
    window.history.replaceState(null, "", accountSectionHref(section));
  };

  const menuItems = useMemo((): AccountNavItem[] => {
    const items: AccountNavItem[] = [
      { id: "overview", label: "خلاصه حساب" },
      { id: "profile", label: "اطلاعات کاربری" },
      { id: "orders", label: fa.dashboard.purchaseHistory, badge: orders.orders.length },
      {
        id: "quotes",
        label: fa.dashboard.workshopQuotes,
        badge: quoteRequests.quotes.length,
      },
      { id: "wishlist", label: fa.dashboard.wishlist, badge: wishlistedProducts.length },
      { id: "compare", label: fa.dashboard.compareList, badge: compareList.count },
      {
        id: "recently-viewed",
        label: fa.dashboard.recentlyViewed,
        badge: recentlyViewed.ids.length,
      },
      { id: "designs", label: fa.dashboard.savedDesigns, badge: designs.designs.length },
    ];
    if (comments.canModerate) {
      items.push({
        id: "moderation",
        label: fa.dashboard.commentModeration,
        badge: comments.pendingCount,
      });
    }
    if (auth.user?.role === "admin") {
      items.push({
        id: "admin-orders",
        label: fa.admin.orders.navLabel,
      });
      items.push({
        id: "admin-products",
        label: fa.admin.products.navLabel,
      });
      items.push({
        id: "admin-trade-in",
        label: fa.admin.tradeIn.navLabel,
      });
      items.push({
        id: "admin-promo-codes",
        label: fa.admin.promoCodes.navLabel,
      });
      items.push({
        id: "admin-home",
        label: fa.admin.home.navLabel,
      });
      items.push({
        id: "admin-posts",
        label: fa.admin.posts.navLabel,
      });
    }
    return items;
  }, [
    auth.user?.role,
    comments.canModerate,
    comments.pendingCount,
    designs.designs.length,
    orders.orders.length,
    quoteRequests.quotes.length,
    wishlistedProducts.length,
    compareList.count,
    recentlyViewed.ids.length,
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
            }}
            isSaving={account.isSaving}
            onSave={account.updateProfile}
          />
        </AccountSectionContainer>
      );
    }

    if (activeSection === "orders") {
      return (
        <AccountSectionContainer
          title={fa.dashboard.purchaseHistory}
          subtitle={fa.dashboard.ordersCount(orders.orders.length)}
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
          {compareProducts.length === 0 ? (
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
          {recentlyViewedProducts.length === 0 ? (
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

    if (activeSection === "moderation") {
      return (
        <AccountSectionContainer
          title={fa.dashboard.commentModeration}
          subtitle={fa.dashboard.commentModerationHint}
        >
          <CommentModeration />
        </AccountSectionContainer>
      );
    }

    return (
      <AccountSectionContainer
        title="خلاصه حساب"
        subtitle="نمای کلی حساب، سفارش‌ها و وضعیت شخصی شما"
      >
        {account.stats ? (
          <AccountOverviewPanel stats={account.stats} onNavigate={navigate} />
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
          <div className="site-container space-y-8">
            <header className="account-page-header">
              <span className="heritage-eyebrow">{fa.dashboard.eyebrow}</span>
              <h1 className="account-page-title">{fa.dashboard.title}</h1>
              <p className="account-page-lead">
                مدیریت پروفایل، سفارش‌ها و علاقه‌مندی‌های شما در یک پنل یکپارچه
              </p>
            </header>

            <AccountShell
              sidebar={
                <div className="account-sidebar-stack">
                  {activeUser ? (
                    <AccountSidebarCard
                      user={{
                        name: activeUser.name,
                        phone: activeUser.phone,
                        tier: activeUser.tier ?? "royal",
                        memberSince,
                      }}
                    />
                  ) : null}
                  <AccountNavMenu
                    items={menuItems}
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
