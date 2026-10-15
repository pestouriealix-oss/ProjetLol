import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { z } from "zod";

import { BracketView } from "@/components/esport/bracket-view";
import { ScheduleList } from "@/components/esport/schedule-list";
import { stageLabel } from "@/components/esport/stage-label";
import { StandingsTable } from "@/components/esport/standings-table";
import { SwissBoard } from "@/components/esport/swiss-board";
import { TeamLogo } from "@/components/esport/team-logo";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { esportApi, EsportApiError, isEsportConfigured } from "@/lib/esport";
import { layoutBracket } from "@/lib/esport/bracket";
import { groupBySerie, pickFeatured, pickStage, type Competition } from "@/lib/esport/competitions";
import type { EsportMatch, Tournament } from "@/lib/esport/schemas";
import { isSwissStage, swissGroups } from "@/lib/esport/swiss";
import { formatLongDate } from "@/lib/format";

export const metadata: Metadata = { title: t.esport.title };

const copy = t.esport;

/** Compétitions suivies : les plus grandes (S) et les ligues majeures (A). */
const TIERS = ["s", "a"];

const idParam = z.coerce.number().int().positive().optional().catch(undefined);

type EsportSearchParams = Promise<{ serie?: string | string[]; etape?: string | string[] }>;

export default async function EsportPage({ searchParams }: { searchParams: EsportSearchParams }) {
  await requireUser();
  const params = await searchParams;

  if (!isEsportConfigured) {
    return (
      <PageShell route="esport" title={copy.title}>
        <Message title={copy.noKeyTitle} body={copy.noKeyBody} />
      </PageShell>
    );
  }

  const now = new Date();
  let view: Awaited<ReturnType<typeof loadView>>;
  try {
    view = await loadView(
      idParam.parse(firstOf(params.serie)),
      idParam.parse(firstOf(params.etape)),
      now,
    );
  } catch (error) {
    if (!(error instanceof EsportApiError)) throw error;
    console.error("Onglet Esport indisponible", error);
    return (
      <PageShell route="esport" title={copy.title}>
        <div>
          <h2 className="display text-2xl text-ink">{copy.errorTitle}</h2>
          <ErrorNotice className="mt-3">{copy.errors[error.kind]}</ErrorNotice>
        </div>
      </PageShell>
    );
  }

  if (!view) {
    return (
      <PageShell route="esport" title={copy.title}>
        <Message title={copy.emptyTitle} body={copy.emptyBody} />
      </PageShell>
    );
  }

  const { competition, stages, stage, content, others } = view;
  const status = competitionStatus(competition, stages, now);

  return (
    <PageShell route="esport" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* La compétition à la une. */}
          <header className="flex flex-wrap items-center gap-4">
            <TeamLogo
              src={competition.leagueImage}
              className="size-14 rounded-panel bg-surface p-2"
              fallback={<Trophy className="size-7" />}
            />
            <div className="min-w-0">
              <h2 className="display text-4xl text-ink">{competition.title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted">
                <Badge tone={status === "live" ? "warn" : "neutral"}>{copy[status]}</Badge>
                {competition.beginAt && competition.endAt ? (
                  <span>
                    {copy.dates(
                      formatLongDate(competition.beginAt),
                      formatLongDate(competition.endAt),
                    )}
                  </span>
                ) : null}
              </p>
            </div>
          </header>

          {/* Les étapes : le choix vit dans l'adresse, la page se partage. */}
          {stages.length > 1 ? (
            <nav aria-label={copy.stages} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <ul className="flex w-max gap-1 rounded-control bg-field p-1">
                {stages.map((candidate) => {
                  const current = candidate.id === stage.id;
                  return (
                    <li key={candidate.id}>
                      <Link
                        href={`/esport?serie=${competition.serieId}&etape=${candidate.id}`}
                        aria-current={current ? "page" : undefined}
                        scroll={false}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-[5px] px-3.5 text-sm font-semibold whitespace-nowrap transition-colors duration-(--duration-fast) ease-(--ease-out)",
                          current
                            ? "bg-raised text-ink shadow-key"
                            : "text-ink-muted hover:text-ink",
                        )}
                      >
                        {isRunning(candidate, now) ? (
                          <span aria-hidden className="size-1.5 rounded-full bg-warn" />
                        ) : null}
                        {stageLabel(candidate.name)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : null}

          {content.kind === "bracket" ? (
            <BracketView sections={layoutBracket(content.bracket)} />
          ) : null}
          {content.kind === "standings" && content.standings.length > 0 ? (
            isSwissStage(stage.name) ? (
              <SwissBoard groups={swissGroups(content.standings)} />
            ) : (
              <StandingsTable standings={content.standings} />
            )
          ) : null}

          <section aria-labelledby="schedule-title" className="flex flex-col gap-3">
            <h3 id="schedule-title" className="display text-xl text-ink">
              {copy.schedule.title}
            </h3>
            <ScheduleList matches={content.matches} now={now} />
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Panel className="p-5">
            <h2 className="display text-xl text-ink">{copy.others.title}</h2>
            {others.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">{copy.others.empty}</p>
            ) : (
              <ul className="flex flex-col pt-2">
                {others.map((other) => (
                  <li key={other.serieId} className="border-t border-line first:border-t-0">
                    <Link
                      href={`/esport?serie=${other.serieId}`}
                      className="flex items-center gap-3 py-2.5 transition-colors duration-(--duration-fast) hover:text-ink"
                    >
                      <TeamLogo
                        src={other.leagueImage}
                        className="size-7"
                        fallback={<Trophy className="size-4" />}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink-muted">
                          {other.title}
                        </span>
                        {other.beginAt && other.endAt ? (
                          <span className="block text-xs text-ink-faint">
                            {copy.dates(formatLongDate(other.beginAt), formatLongDate(other.endAt))}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <p className="text-xs text-ink-faint">
            <a
              href="https://pandascore.co"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              {copy.credit}
            </a>
          </p>
        </aside>
      </div>
    </PageShell>
  );
}

const firstOf = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** En cours, à venir ou terminée, d'après les dates de ses étapes. */
function competitionStatus(
  competition: Competition,
  stages: Tournament[],
  now: Date,
): "live" | "upcoming" | "finished" {
  if (stages.some((stage) => isRunning(stage, now))) return "live";
  if (competition.beginAt && competition.beginAt > now) return "upcoming";
  if (competition.endAt && competition.endAt < now) return "finished";
  return "live";
}

const isRunning = (stage: Tournament, now: Date) => {
  const begin = stage.begin_at ? new Date(stage.begin_at).getTime() : Infinity;
  const end = stage.end_at ? new Date(stage.end_at).getTime() : Infinity;
  return begin <= now.getTime() && now.getTime() <= end;
};

type StageContent =
  | {
      kind: "bracket";
      bracket: Awaited<ReturnType<typeof esportApi.tournamentBracket>>;
      matches: EsportMatch[];
    }
  | {
      kind: "standings";
      standings: Awaited<ReturnType<typeof esportApi.tournamentStandings>>;
      matches: EsportMatch[];
    };

/** Charge la compétition affichée, ses étapes, le contenu de l'étape choisie, et les autres compétitions. */
async function loadView(
  requestedSerie: number | undefined,
  requestedStage: number | undefined,
  now: Date,
): Promise<{
  competition: Competition;
  stages: Tournament[];
  stage: Tournament;
  content: StageContent;
  others: Competition[];
} | null> {
  const [running, upcoming] = await Promise.all([
    esportApi.listTournaments("running", TIERS),
    esportApi.listTournaments("upcoming", TIERS),
  ]);
  const runningCompetitions = groupBySerie(running);
  const upcomingCompetitions = groupBySerie(upcoming).filter(
    (candidate) => !runningCompetitions.some((known) => known.serieId === candidate.serieId),
  );
  const all = [...runningCompetitions, ...upcomingCompetitions];

  const featured =
    all.find((candidate) => candidate.serieId === requestedSerie) ??
    pickFeatured(runningCompetitions, upcomingCompetitions);
  if (!featured) return null;

  // Toutes les étapes de la compétition, y compris celles déjà terminées : ses
  // dates vont alors du début de la première à la fin de la dernière.
  const complete = groupBySerie(await esportApi.listSerieTournaments(featured.serieId))[0];
  const competition = complete ?? featured;
  const stages = competition.stages;
  const stage = pickStage(stages, now, requestedStage);
  if (!stage) return null;

  const content: StageContent = stage.has_bracket
    ? await esportApi.tournamentBracket(stage.id).then((bracket) => ({
        kind: "bracket" as const,
        bracket,
        matches: bracket,
      }))
    : await Promise.all([
        esportApi.tournamentStandings(stage.id),
        esportApi.tournamentMatches(stage.id),
      ]).then(([standings, matches]) => ({ kind: "standings" as const, standings, matches }));

  const others = all
    .filter((candidate) => candidate.serieId !== competition.serieId)
    .sort((a, b) => (a.beginAt?.getTime() ?? Infinity) - (b.beginAt?.getTime() ?? Infinity))
    .slice(0, 8);

  return { competition, stages, stage, content, others };
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Panel className="max-w-2xl p-6">
      <h2 className="display text-2xl text-ink">{title}</h2>
      <p className="mt-2 text-ink-muted">{body}</p>
    </Panel>
  );
}
