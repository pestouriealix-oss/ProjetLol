import type { Metadata } from "next";
import { z } from "zod";

import { PageShell } from "@/components/layout/page-shell";
import { RoleGlyph } from "@/components/map/role-glyph";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { AccountSwitcher } from "@/components/profile/account-switcher";
import { CurrentGoal, GoalHistory } from "@/components/progression/goal-sections";
import { TrendCard } from "@/components/progression/trend-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { ROLES, type Role } from "@/lib/config";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { listPlayedGames } from "@/lib/db/progression";
import {
  buildTrend,
  defaultTrendRole,
  MIN_COUNTED_SECONDS,
  TREND_METRICS,
  type Trend,
} from "@/lib/stats/goals";

import { loadGoalProgress } from "../goal-progress";
import { getSelectedAccount } from "../selected-account";

export const metadata: Metadata = { title: t.progression.title };

const copy = t.progression;

/** Objectifs relus : l'actuel et ceux d'avant. */
const GOALS = 6;
/** Parties lues pour les tendances, tous postes confondus. */
const READ_GAMES = 100;
/** Parties tracées sur chaque courbe, au poste choisi. */
const TREND_GAMES = 20;

const ROLE_PARAM = {
  top: "TOP",
  jungle: "JUNGLE",
  mid: "MID",
  adc: "ADC",
  support: "SUPPORT",
} as const satisfies Record<string, Role>;
type RoleKey = keyof typeof ROLE_PARAM;
const roleKey = (role: Role) =>
  (Object.keys(ROLE_PARAM) as RoleKey[]).find((key) => ROLE_PARAM[key] === role)!;
const roleParam = z.enum(["top", "jungle", "mid", "adc", "support"]).optional().catch(undefined);

type ProgressionSearchParams = Promise<{ compte?: string | string[]; poste?: string | string[] }>;

export default async function ProgressionPage({
  searchParams,
}: {
  searchParams: ProgressionSearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const { accounts, account } = await getSelectedAccount(user.id, Promise.resolve(params));

  if (!account) {
    return (
      <PageShell route="progression" title={copy.title}>
        <MatchListEmpty
          title={copy.emptyTitle}
          body={t.matches.noAccountBody}
          action={
            <Button asChild>
              <Link href="/settings">{t.matches.noAccountAction}</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const [progress, games, champions] = await Promise.all([
    loadGoalProgress(user.id, account.id, { goals: GOALS }),
    listPlayedGames(user.id, account.id, { limit: READ_GAMES }),
    getChampionAssets(),
  ]);
  const [current, ...previous] = progress;

  // Postes joués récemment, dans l'ordre de la carte ; celui de l'adresse s'il en fait partie.
  const playedRoles = ROLES.filter((role) => games.some((game) => game.role === role));
  const requested = roleParam.parse(Array.isArray(params.poste) ? params.poste[0] : params.poste);
  const role =
    requested && playedRoles.includes(ROLE_PARAM[requested])
      ? ROLE_PARAM[requested]
      : defaultTrendRole(games, current?.goal.role ?? null);

  const roleGames = games
    .filter((game) => game.role === role && game.durationSeconds >= MIN_COUNTED_SECONDS)
    .slice(0, TREND_GAMES);
  const goalHere = current && current.goal.role === role ? current.goal : null;
  const metrics = role
    ? [
        ...TREND_METRICS[role],
        // L'indicateur de l'objectif a toujours sa courbe, même hors des quatre habituels.
        ...(goalHere && !TREND_METRICS[role].includes(goalHere.metric) ? [goalHere.metric] : []),
      ]
    : [];
  const trends = role
    ? metrics
        .map((metric) => buildTrend(metric, roleGames, role))
        .filter((trend): trend is Trend => trend !== null)
    : [];

  const href = (key: RoleKey) => `/progression?compte=${account.id}&poste=${key}`;

  return (
    <PageShell
      route="progression"
      title={copy.title}
      aside={<AccountSwitcher basePath="/progression" accounts={accounts} currentId={account.id} />}
    >
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>

      {games.length === 0 ? (
        <MatchListEmpty
          title={copy.emptyTitle}
          body={copy.emptyBody}
          action={
            <Button asChild variant="secondary">
              <Link href={`/dashboard?compte=${account.id}`}>{t.matches.toDashboard}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section aria-label={copy.goal.title}>
            {current ? (
              <CurrentGoal progress={current} champions={champions} />
            ) : (
              <Panel className="flex flex-col items-start gap-3 border-dashed p-5 sm:p-6">
                <h2 className="display text-2xl text-ink">{copy.goal.emptyTitle}</h2>
                <p className="max-w-[60ch] text-ink-muted">{copy.goal.emptyBody}</p>
                <Button asChild variant="secondary" className="mt-1">
                  <Link href={`/matches?compte=${account.id}`}>{copy.goal.emptyAction}</Link>
                </Button>
              </Panel>
            )}
          </section>

          <section aria-labelledby="trends-title" className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <h2 id="trends-title" className="display text-2xl text-ink">
                  {copy.trends.title}
                </h2>
                {role && trends.length > 0 ? (
                  <p className="text-sm text-ink-muted">
                    {copy.trends.body(roleGames.length, t.roles[role])}
                  </p>
                ) : null}
              </div>
              {playedRoles.length > 1 ? (
                // Le poste choisi vit dans l'adresse : la page se partage, Retour fonctionne.
                <nav aria-label={copy.trends.role} className="w-fit">
                  <ul className="flex gap-1 rounded-control bg-field p-1">
                    {playedRoles.map((played) => {
                      const selected = played === role;
                      return (
                        <li key={played}>
                          <Link
                            href={href(roleKey(played))}
                            scroll={false}
                            aria-current={selected ? "page" : undefined}
                            className={cn(
                              "flex h-10 items-center gap-1.5 rounded-[5px] px-3 text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-out) sm:h-9",
                              selected
                                ? "bg-raised text-ink shadow-key"
                                : "text-ink-muted hover:text-ink",
                            )}
                          >
                            <RoleGlyph role={played} className="size-3.5" />
                            <span className="max-sm:sr-only">{t.roles[played]}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              ) : null}
            </div>
            {role && trends.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {trends.map((trend) => (
                  <TrendCard
                    key={trend.metric}
                    trend={trend}
                    goal={goalHere}
                    champions={champions}
                  />
                ))}
              </div>
            ) : (
              <Panel className="p-5 text-ink-muted">
                {role ? copy.trends.tooFew(t.roles[role]) : copy.trends.noRole}
              </Panel>
            )}
          </section>

          {previous.length > 0 ? <GoalHistory items={previous} /> : null}
        </>
      )}
    </PageShell>
  );
}
