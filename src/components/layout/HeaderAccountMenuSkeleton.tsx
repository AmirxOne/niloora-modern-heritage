/** Placeholder for header auth slot while session/chunk loads — keeps layout stable. */
export function HeaderAccountMenuSkeleton() {
  return (
    <div
      className="header-account-menu-skeleton"
      aria-busy="true"
      aria-label="در حال بارگذاری حساب کاربری"
    >
      <span className="header-account-menu-skeleton-icon" aria-hidden />
      <span className="header-account-menu-skeleton-label hidden sm:block" aria-hidden />
      <span className="header-account-menu-skeleton-chevron hidden sm:block" aria-hidden />
    </div>
  );
}
