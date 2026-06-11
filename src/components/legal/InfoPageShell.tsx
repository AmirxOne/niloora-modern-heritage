import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  breadcrumb?: BreadcrumbItem[];
  children: React.ReactNode;
};

export function InfoPageShell({ eyebrow, title, subtitle, breadcrumb, children }: InfoPageShellProps) {
  return (
    <PageTransition>
      <div className="info-page pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="info-page-shell">
            {breadcrumb && breadcrumb.length > 0 ? <Breadcrumb items={breadcrumb} /> : null}
            <PageHeader
              eyebrow={eyebrow}
              title={title}
              subtitle={subtitle}
              className="info-page-header"
            />
            <div className="info-page-content">{children}</div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
