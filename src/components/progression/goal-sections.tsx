import { Check, X } from "lucide-react";

import { Slash } from "@/components/brand/slash";
import { ChampionIcon } from "@/components/champion/champion-icon";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import { formatLongDate, formatShortDate } from "@/lib/format";
import type { GoalCheck, GoalProgress } from "@/lib/stats/goals";

import { formatMetric, formatTarget } from "./format";

const copy = t.progression;

/** Parties montrées sous l'objectif en cours, de la plus ancienne à la plus récente. */
const SHOWN_CHECKS = 10;

/**
 * L'objectif en cours : la phrase du coach, sa cible, et chaque partie jouée
 * depuis, tenue ou manquée. Le résultat se lit au signe et au libellé, pas à
 * la couleur seule.
 */
export function CurrentGoal({
  progress,
  champions,
}: {
  progress: GoalProgress;
  champions: ChampionAssets | null;
}) {
  const { goal, checks, met } = progress;
  const role = t.roles[goal.role];
  const shown = checks.slice(0, SHOWN_CHECKS).reverse();

  return (
    <Panel className="relative isolate overflow-hidden">
      {/* Une lueur corail dans le coin : c'est le coach qui parle. */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 -z-10 size-72 rounded-full bg-accent-soft blur-3xl"
      />
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <Slash className="h-[0.95em]" />
            {copy.goal.title}
          </p>
          <p className="display text-2xl text-balance text-ink sm:text-3xl">
            {goal.text ?? formatTarget(goal)}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-muted">
            <span className="rounded-pill bg-accent/15 px-2.5 py-0.5 font-semibold text-accent-ink tabular">
              {formatTarget(goal)}
            </span>
            <span>{copy.goal.checkedOn(role)}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3 border-line max-lg:border-t max-lg:pt-5 lg:border-l lg:pl-6">
          {checks.length > 0 ? (
            <>
              <p className="flex items-baseline gap-3">
                <span aria-hidden className="display text-5xl text-ink tabular">
                  {copy.goal.recordShort(met, checks.length)}
                </span>
                <span aria-hidden className="text-sm text-ink-muted">
                  {copy.goal.recordCaption(checks.length)}
                </span>
                <span className="sr-only">{copy.goal.record(met, checks.length)}</span>
              </p>
              <CheckStrip checks={shown} champions={champions} metric={goal.metric} />
            </>
          ) : (
            <p className="text-ink-muted">{copy.goal.waiting(role)}</p>
          )}
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line px-5 py-3 text-sm text-ink-faint sm:px-6">
        <span>
          {copy.goal.setBy(
            formatLongDate(goal.setAt),
            champions?.name(goal.championName) ?? goal.championName,
          )}
        </span>
        <Link
          href={`/matches/${goal.matchId}`}
          className="tap font-semibold text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) hover:text-ink hover:underline"
        >
          {copy.goal.openMatch}
        </Link>
      </footer>
    </Panel>
  );
}

/** Une case par partie vérifiée : le champion joué, et un signe tenu ou manqué. */
export function CheckStrip({
  checks,
  champions,
  metric,
  size = "regular",
}: {
  checks: GoalCheck[];
  champions: ChampionAssets | null;
  metric: GoalProgress["goal"]["metric"];
  size?: "regular" | "small";
}) {
  return (
    <ol className="flex flex-wrap gap-1.5">
      {checks.map((check) => {
        const name = champions?.name(check.championName) ?? check.championName;
        const label = copy.goal.check(
          name,
          formatShortDate(check.startedAt),
          formatMetric(metric, check.value),
          check.met,
        );
        return (
          <li key={check.matchId}>
            <Link
              href={`/matches/${check.matchId}`}
              aria-label={label}
              title={label}
              className="relative block rounded-control"
            >
              <ChampionIcon
                name={name}
                src={champions?.iconUrl(check.championName) ?? null}
                className={cn(
                  size === "small" ? "size-7" : "size-9",
                  !check.met && "opacity-55 grayscale-[0.6]",
                )}
              />
              <span
                aria-hidden
                className={cn(
                  "absolute -right-1 -bottom-1 flex items-center justify-center rounded-full ring-2 ring-surface",
                  size === "small" ? "size-3.5" : "size-4",
                  check.met ? "bg-win text-canvas" : "bg-loss text-canvas",
                )}
              >
                {check.met ? (
                  <Check strokeWidth={3.5} className="size-[70%]" />
                ) : (
                  <X strokeWidth={3.5} className="size-[70%]" />
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Les objectifs d'avant, chacun avec son bilan sur les parties où il était en cours. */
export function GoalHistory({ items }: { items: GoalProgress[] }) {
  return (
    <section aria-labelledby="history-title" className="flex flex-col gap-3">
      <h2 id="history-title" className="display text-2xl text-ink">
        {copy.history.title}
      </h2>
      <Panel>
        <ul className="divide-y divide-line">
          {items.map(({ goal, checks, met }) => (
            <li
              key={goal.reviewId}
              className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-ink">{goal.text ?? formatTarget(goal)}</p>
                <p className="text-sm text-ink-faint">
                  {copy.history.setOn(formatShortDate(goal.setAt))} · {t.roles[goal.role]}
                </p>
              </div>
              <span className="w-fit rounded-pill bg-raised px-2.5 py-0.5 text-sm font-semibold text-ink-muted tabular">
                {formatTarget(goal)}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular sm:w-36 sm:text-right",
                  checks.length === 0
                    ? "text-ink-faint"
                    : met * 2 >= checks.length
                      ? "text-win"
                      : "text-ink-muted",
                )}
              >
                {copy.history.record(met, checks.length)}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </section>
  );
}
