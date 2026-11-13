import { Slash } from "@/components/brand/slash";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import type { GoalProgress } from "@/lib/stats/goals";

import { formatTarget } from "./format";
import { CheckStrip } from "./goal-sections";

const copy = t.progression;

/** Parties montrées dans le rappel, les plus récentes. */
const SHOWN_CHECKS = 6;

/**
 * Le rappel du tableau de bord : l'objectif en cours et où il en est. Sans
 * objectif, une invitation à écrire le bilan de la dernière partie.
 */
export function GoalReminder({
  progress,
  champions,
  progressionHref,
  lastMatchId,
  owned,
}: {
  progress: GoalProgress | null;
  champions: ChampionAssets | null;
  progressionHref: string;
  /** Dernière partie jouée : là où l'invitation mène. */
  lastMatchId: string | null;
  /** Propriété du compte prouvée : sinon, l'invitation mène d'abord à la preuve. */
  owned: boolean;
}) {
  if (!progress) {
    if (!lastMatchId) return null;
    if (!owned) {
      return (
        <Panel className="flex flex-col gap-3 border-dashed p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-ink">{copy.dashboard.confirmTitle}</h2>
            <p className="text-sm text-ink-muted">{copy.dashboard.confirmBody}</p>
          </div>
          <Button asChild variant="secondary" className="w-fit shrink-0">
            <Link href="/settings">{copy.dashboard.confirmAction}</Link>
          </Button>
        </Panel>
      );
    }
    return (
      <Panel className="flex flex-col gap-3 border-dashed p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{copy.dashboard.inviteTitle}</h2>
          <p className="text-sm text-ink-muted">{copy.dashboard.inviteBody}</p>
        </div>
        <Button asChild variant="secondary" className="w-fit shrink-0">
          <Link href={`/matches/${lastMatchId}`}>{copy.dashboard.inviteAction}</Link>
        </Button>
      </Panel>
    );
  }

  const { goal, checks, met } = progress;
  return (
    <Panel className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -left-16 -z-10 size-56 rounded-full bg-accent-soft blur-3xl"
      />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Slash className="h-[0.95em]" />
            {copy.dashboard.title}
          </h2>
          <p className="font-semibold text-pretty text-ink">{goal.text ?? formatTarget(goal)}</p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
            <span className="rounded-pill bg-accent/15 px-2 py-0.5 font-semibold text-accent-ink tabular">
              {formatTarget(goal)}
            </span>
            <Link
              href={progressionHref}
              className="tap font-semibold text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
            >
              {copy.dashboard.see}
            </Link>
          </p>
        </div>
        {checks.length > 0 ? (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <p className="text-sm text-ink-muted">
              <span aria-hidden>
                <span className="display text-2xl text-ink tabular">
                  {copy.goal.recordShort(met, checks.length)}
                </span>{" "}
                {copy.goal.recordCaption(checks.length)}
              </span>
              <span className="sr-only">{copy.goal.record(met, checks.length)}</span>
            </p>
            <CheckStrip
              checks={checks.slice(0, SHOWN_CHECKS).reverse()}
              champions={champions}
              metric={goal.metric}
              size="small"
            />
          </div>
        ) : (
          <p className="text-sm text-ink-muted sm:max-w-56 sm:text-right">
            {copy.goal.waiting(t.roles[goal.role])}
          </p>
        )}
      </div>
    </Panel>
  );
}
