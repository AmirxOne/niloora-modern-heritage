import { OrnamentalDivider } from "@/components/ui/OrnamentalDivider";
import { PageTransition } from "@/components/layout/PageTransition";

type InfoPageShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function InfoPageShell({ eyebrow, title, subtitle, children }: InfoPageShellProps) {
  return (
    <PageTransition>
      <div className="info-page pb-24 pt-28 md:pt-32">
        <div className="site-container max-w-3xl">
          <header className="info-page-header">
            <span className="heritage-eyebrow">{eyebrow}</span>
            <h1 className="info-page-title">{title}</h1>
            {subtitle ? <p className="info-page-subtitle">{subtitle}</p> : null}
            <OrnamentalDivider className="mx-auto my-6 max-w-[12rem]" />
          </header>
          <div className="info-page-content">{children}</div>
        </div>
      </div>
    </PageTransition>
  );
}
