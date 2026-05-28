import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/layout/PageTransition";

type InfoPageShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function InfoPageShell({ eyebrow, title, subtitle, children }: InfoPageShellProps) {
  return (
    <PageTransition>
      <div className="info-page pb-24 pt-20 md:pt-24">
        <div className="site-container">
          <div className="info-page-shell">
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
