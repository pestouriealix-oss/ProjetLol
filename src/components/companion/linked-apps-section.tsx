import { MonitorSmartphone } from "lucide-react";

import { revokeAppTokenAction } from "@/app/(app)/settings/actions";
import { SectionHeading } from "@/components/ui/panel";
import { SubmitButton } from "@/components/ui/submit-button";
import { t } from "@/i18n/fr";
import type { AppTokenSummary } from "@/lib/db/app-links";
import { formatLongDate } from "@/lib/format";

const copy = t.companion.settings;

/**
 * Les apps reliées au compte (l'app Overwolf), avec de quoi couper leur
 * accès. Affichée seulement quand il y en a une.
 */
export function LinkedAppsSection({ apps }: { apps: AppTokenSummary[] }) {
  return (
    <section
      aria-labelledby="apps-title"
      className="flex flex-col gap-6 border-t border-line pt-10"
    >
      <SectionHeading id="apps-title" title={copy.title} description={copy.description} />
      <ul className="flex flex-col divide-y divide-line">
        {apps.map((app) => {
          const linkedOn = formatLongDate(app.createdAt);
          return (
            <li
              key={app.id}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <MonitorSmartphone aria-hidden className="size-5 shrink-0 text-ink-faint" />
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{app.name}</p>
                  <p className="text-sm text-ink-muted">
                    {copy.linkedOn(linkedOn)}
                    {app.lastUsedAt ? `, ${copy.lastUsed(formatLongDate(app.lastUsedAt))}` : null}
                  </p>
                </div>
              </div>
              <form action={revokeAppTokenAction}>
                <input type="hidden" name="tokenId" value={app.id} />
                <SubmitButton
                  variant="secondary"
                  size="sm"
                  aria-label={copy.revokeLabel(app.name, linkedOn)}
                >
                  {copy.revoke}
                </SubmitButton>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
