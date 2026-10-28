import { Panel } from "@/components/ui/panel";
import { ErrorNotice } from "@/components/ui/notice";
import { t } from "@/i18n/fr";
import type { Platform } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import type { MatchDetail } from "@/lib/stats/match-detail";
import type { ReducedTimeline } from "@/lib/stats/timeline";
import { loadMatchTimeline } from "@/lib/sync/match-timeline";

import { BuildOrder, SkillOrder } from "./build-order";
import { GoldChart, type ObjectiveLegend, type ObjectiveMark } from "./gold-chart";
import type { AssetResolver } from "./team-table";

const copy = t.matchDetail.timeline;

/**
 * La chronologie de la partie : écart d'or et objectifs, puis l'ordre d'achat
 * et l'ordre des compétences du joueur. Chargée à part (dans un `Suspense`) :
 * le premier affichage d'une partie demande la chronologie à Riot, et le
 * tableau des joueurs ne doit pas l'attendre.
 */
export async function TimelineSection({
  userId,
  match,
  detail,
  assets,
}: {
  userId: string;
  match: { id: string; platform: Platform; stored: unknown };
  detail: MatchDetail;
  assets: AssetResolver;
}) {
  const [ours] = detail.teams;
  const teamOf = new Map(
    detail.teams.flatMap((team) => team.players.map((player) => [player.puuid, team.teamId])),
  );
  const result = await loadMatchTimeline(userId, match, (puuid) => teamOf.get(puuid));

  return (
    <section aria-labelledby="timeline-title" className="flex flex-col gap-4">
      <h2 id="timeline-title" className="display text-2xl text-ink">
        {copy.title}
      </h2>
      {!result.ok ? (
        <ErrorNotice>{copy.errors[result.reason]}</ErrorNotice>
      ) : (
        <TimelineContent
          timeline={result.timeline}
          detail={detail}
          ourTeamId={ours.teamId}
          assets={assets}
        />
      )}
    </section>
  );
}

function TimelineContent({
  timeline,
  detail,
  ourTeamId,
  assets,
}: {
  timeline: ReducedTimeline;
  detail: MatchDetail;
  ourTeamId: number;
  assets: AssetResolver;
}) {
  const points = timeline.gold.map((frame) => ({
    minute: frame.minute,
    diff: ourTeamId === 100 ? frame.blue - frame.red : frame.red - frame.blue,
  }));
  const objectives: ObjectiveMark[] = timeline.objectives.map((objective) => {
    const ours = objective.teamId === ourTeamId;
    const element = objective.subType ? copy.dragons[objective.subType] : undefined;
    const name = element
      ? `${copy.objectives[objective.type]} ${element}`
      : copy.objectives[objective.type];
    return {
      seconds: objective.seconds,
      ours,
      short: copy.objectiveShort[objective.type],
      label: copy.objectiveAt(
        name,
        ours ? copy.ours : copy.theirs,
        formatDuration(objective.seconds),
      ),
    };
  });
  // Légende : les lettres présentes, dans l'ordre de la copie (drake, elder, nash…).
  const present = new Set(timeline.objectives.map((objective) => objective.type));
  const legend: ObjectiveLegend[] = (
    Object.keys(copy.objectiveShort) as (keyof typeof copy.objectiveShort)[]
  )
    .filter((type) => present.has(type))
    .map((type) => ({ short: copy.objectiveShort[type], name: copy.objectives[type] }));
  const mine = timeline.players[detail.me.puuid];

  return (
    <>
      <div className="flex flex-col gap-2">
        <div>
          <h3 className="display text-xl text-ink">{copy.gold.title}</h3>
          <p className="text-sm text-ink-muted">{copy.gold.body}</p>
        </div>
        <GoldChart
          points={points}
          objectives={objectives}
          legend={legend}
          durationSeconds={detail.durationSeconds}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <Panel className="flex flex-col gap-3 p-5">
          <h3 className="display text-xl text-ink">{copy.build.title}</h3>
          <BuildOrder items={mine?.items ?? []} resolve={assets.item} />
        </Panel>
        <Panel className="flex flex-col gap-3 p-5">
          <h3 className="display text-xl text-ink">{copy.skills.title}</h3>
          <SkillOrder skills={mine?.skills ?? []} />
        </Panel>
      </div>
    </>
  );
}

export function TimelineSkeleton() {
  return (
    <section aria-hidden className="flex flex-col gap-4">
      <p className="display text-2xl text-ink">{copy.title}</p>
      <span className="sr-only" role="status">
        {copy.loading}
      </span>
      <div className="h-48 shimmer rounded-panel sm:h-56" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <div className="h-40 shimmer rounded-panel" />
        <div className="h-40 shimmer rounded-panel" />
      </div>
    </section>
  );
}
