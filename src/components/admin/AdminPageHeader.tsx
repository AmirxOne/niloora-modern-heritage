import { PageHeader } from "@/components/ui/PageHeader";

export function AdminPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: React.ReactNode;
}) {
  return (
    <PageHeader title={title} subtitle={subtitle} className="page-header--admin" />
  );
}
