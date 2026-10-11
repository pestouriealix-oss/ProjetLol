import { PageShell } from "@/components/layout/page-shell";
import { Panel } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

export default function SettingsLoading() {
  return (
    <PageShell title={t.settings.title}>
      <span className="sr-only" role="status">
        {t.common.loading}
      </span>
      <Panel className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-44" />
      </Panel>
      <Panel className="flex flex-col gap-5 px-5 py-5 sm:px-6">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </Panel>
    </PageShell>
  );
}
