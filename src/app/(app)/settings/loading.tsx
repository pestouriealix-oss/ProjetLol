import { PageShell } from "@/components/layout/page-shell";
import { Panel, SectionHeading } from "@/components/ui/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";

const copy = t.settings;

/**
 * Squelette de Paramètres. Tout ce qui ne dépend pas des données est déjà à sa
 * place (titres, textes) ; seuls les blocs en attente miroitent, aux dimensions
 * du cas le plus courant : un compte lié, une place libre, le formulaire.
 *
 * Quand les données arrivent, la page se fond à la place du squelette (même
 * `route` que `page.tsx`) : garder ici la même structure et les mêmes
 * espacements que la page, pour que rien ne saute pendant le fondu.
 */
export default function SettingsLoading() {
  return (
    <PageShell route="settings" title={copy.title}>
      <section className="flex flex-col gap-6">
        <span className="sr-only" role="status">
          {t.common.loading}
        </span>
        <div aria-hidden className="contents">
          <SectionHeading
            title={copy.riot.title}
            description={copy.riot.description}
            aside={<Skeleton className="h-5 w-36" />}
          />
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="flex flex-col gap-3">
              {/* Sur un écran étroit, la ligne d'un compte passe sur plusieurs lignes. */}
              <Skeleton className="h-49 rounded-panel min-[34rem]:h-[7.375rem]" />
              <Skeleton className="h-[3.875rem] rounded-panel" />
            </div>
            <Panel className="p-5">
              <p className="pb-4 text-lg font-semibold text-ink">{copy.riot.addTitle}</p>
              <div className="flex flex-col gap-4">
                <FieldSkeleton label={copy.riot.riotId} hint={copy.riot.riotIdHint} />
                <FieldSkeleton label={copy.riot.platform} />
                <div>
                  <p className="pb-2 text-sm font-semibold text-ink">{copy.riot.roles}</p>
                  {/* Une pastille par rôle, à la largeur de son libellé. */}
                  <div className="flex flex-wrap gap-1.5">
                    {["w-18", "w-23", "w-18", "w-19", "w-25"].map((width, index) => (
                      <Skeleton key={index} className={`h-9 rounded-pill ${width}`} />
                    ))}
                  </div>
                  <p className="pt-1.5 text-sm text-ink-faint">{copy.riot.rolesHint}</p>
                </div>
                <Skeleton className="mt-1 h-10 w-44" />
              </div>
            </Panel>
          </div>
        </div>
      </section>

      <section aria-hidden className="flex flex-col gap-6 border-t border-line pt-10">
        <SectionHeading title={copy.account.title} />
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
          <div className="flex flex-wrap gap-x-12 gap-y-5">
            <div>
              <p className="text-sm text-ink-muted">{copy.account.email}</p>
              <Skeleton className="mt-2 h-6 w-64" />
            </div>
            <div>
              <p className="text-sm text-ink-muted">{copy.account.plan}</p>
              <Skeleton className="mt-1.5 h-6 w-16 rounded-pill" />
            </div>
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-panel border border-loss/25 px-5 py-5">
          <div className="max-w-[58ch]">
            <p className="text-lg font-semibold text-ink">{copy.account.dangerTitle}</p>
            <p className="pt-1 text-ink-muted">{copy.account.dangerBody}</p>
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
      </section>
    </PageShell>
  );
}

/** Un champ du formulaire en attente : son libellé, la place du contrôle, son aide. */
function FieldSkeleton({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <p className="pb-1.5 text-sm font-semibold text-ink">{label}</p>
      <Skeleton className="h-11" />
      {hint ? <p className="pt-1.5 text-sm text-ink-faint">{hint}</p> : null}
    </div>
  );
}
