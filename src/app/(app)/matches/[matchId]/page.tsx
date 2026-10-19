import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ChampionIcon } from "@/components/champion/champion-icon";
import { PageShell } from "@/components/layout/page-shell";
import { Duel } from "@/components/match-detail/duel";
import {
  TeamTable,
  type AssetResolver,
  type PlayerRanks,
} from "@/components/match-detail/team-table";
import { rankLabel } from "@/components/stats/lp-points";
import { TimelineSection, TimelineSkeleton } from "@/components/match-detail/timeline-section";
import { ErrorNotice } from "@/components/ui/notice";
import { Link } from "@/components/ui/link";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { getGameAssets } from "@/lib/ddragon/game-assets";
import { findPlayedMatch } from "@/lib/db/matches";
import { formatDuration, formatRelative } from "@/lib/format";
import type { Platform } from "@/lib/config";
import { loadPlayerRanks } from "@/lib/riot";
import { rankQueueFor } from "@/lib/stats/live-game";
import { buildMatchDetail, type DetailTeam } from "@/lib/stats/match-detail";
import { rankedQueue } from "@/lib/stats/participation";

export const metadata: Metadata = { title: t.matchDetail.title };

const copy = t.matchDetail;

/** Identifiant Riot d'une partie : « EUW1_7123456789 ». */
const MATCH_ID = /^[A-Z0-9]{2,5}_\d{1,15}$/;

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const user = await requireUser();
  const { matchId } = await params;
  if (!MATCH_ID.test(matchId)) notFound();

  const played = await findPlayedMatch(user.id, matchId);
  // Une partie qu'aucun de ses comptes n'a jouée n'existe pas pour lui.
  if (!played) notFound();

  const backHref = `/matches?compte=${played.accountId}`;
  const detail = buildMatchDetail(played.details, played.puuid);
  if (!detail) {
    return (
      <PageShell route="match" title={copy.unreadableTitle} header={<BackLink href={backHref} />}>
        <div>
          <h1 className="display text-3xl text-ink sm:text-4xl">{copy.unreadableTitle}</h1>
          <ErrorNotice className="mt-3">{copy.unreadableBody}</ErrorNotice>
        </div>
      </PageShell>
    );
  }

  const [champions, game] = await Promise.all([getChampionAssets(), getGameAssets()]);
  const assets: AssetResolver = {
    champion: (championName) => ({
      name: champions?.name(championName) ?? championName,
      iconUrl: champions?.iconUrl(championName) ?? null,
    }),
    item: (id) => game?.item(id) ?? null,
    spell: (key) => game?.spell(key) ?? null,
    rune: (id) => game?.rune(id) ?? null,
  };

  const { me, teams } = detail;
  const [ours, theirs] = teams;
  const champion = assets.champion(me.championName);
  const opponent = me.role ? (theirs.players.find((p) => p.role === me.role) ?? null) : null;
  const queue = rankedQueue(detail.queueId) ?? "OTHER";
  const minutes = detail.durationSeconds / 60;
  const tables: TeamsProps = {
    ours,
    theirs,
    maxDamage: detail.maxDamage,
    durationMinutes: minutes,
    assets,
  };

  return (
    <PageShell
      route="match"
      title={champion.name}
      header={
        <header className="flex flex-col gap-5">
          <BackLink href={backHref} />
          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className={cn(
                "h-14 w-1.5 shrink-0 -skew-x-[14deg] rounded-[1px]",
                ours.win ? "bg-win" : "bg-loss",
              )}
            />
            <ChampionIcon name={champion.name} src={champion.iconUrl} className="size-16" />
            <div className="min-w-0">
              <h1 className="truncate display text-3xl text-ink sm:text-4xl">{champion.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-muted">
                <span className={cn("font-semibold", ours.win ? "text-win" : "text-loss")}>
                  {ours.win ? t.matches.win : t.matches.loss}
                </span>
                <span aria-hidden>·</span>
                {me.role ? (
                  <>
                    <span>{t.roles[me.role]}</span>
                    <span aria-hidden>·</span>
                  </>
                ) : null}
                <span>{t.matches.queues[queue]}</span>
                <span aria-hidden>·</span>
                <span className="tabular">{formatDuration(detail.durationSeconds)}</span>
                <span aria-hidden>·</span>
                <time dateTime={detail.startedAt.toISOString()}>
                  {formatRelative(detail.startedAt)}
                </time>
                <span aria-hidden>·</span>
                <span>{copy.patch(detail.patch)}</span>
              </p>
            </div>
          </div>
        </header>
      }
    >
      {/* Les tableaux s'affichent tout de suite ; les rangs (dix appels à Riot)
          arrivent ensuite, à la même place. */}
      <Suspense fallback={<Teams {...tables} />}>
        <RankedTeams
          {...tables}
          platform={played.platform}
          queueId={detail.queueId}
          puuids={[...ours.players, ...theirs.players].map((player) => player.puuid)}
        />
      </Suspense>
      <div className="max-w-2xl">
        <Duel me={me} opponent={opponent} assets={assets} />
      </div>
      <Suspense fallback={<TimelineSkeleton />}>
        <TimelineSection
          userId={user.id}
          match={{ id: matchId, platform: played.platform, stored: played.timeline }}
          detail={detail}
          assets={assets}
        />
      </Suspense>
    </PageShell>
  );
}

type TeamsProps = {
  ours: DetailTeam;
  theirs: DetailTeam;
  maxDamage: number;
  durationMinutes: number;
  assets: AssetResolver;
  ranks?: PlayerRanks;
};

function Teams({ ours, theirs, ranks, ...shared }: TeamsProps) {
  return (
    <>
      <TeamTable team={ours} ranks={ranks} {...shared} />
      <TeamTable team={theirs} ranks={ranks} {...shared} />
    </>
  );
}

/** Les deux équipes avec le classement actuel de chaque joueur, dans la file de la partie. */
async function RankedTeams({
  platform,
  queueId,
  puuids,
  ...teams
}: TeamsProps & { platform: Platform; queueId: number; puuids: string[] }) {
  let entries: Awaited<ReturnType<typeof loadPlayerRanks>>;
  try {
    entries = await loadPlayerRanks(platform, puuids);
  } catch (error) {
    // Sans les rangs, la partie reste lisible : les tableaux restent tels quels.
    console.error("Rangs des joueurs indisponibles", error);
    return <Teams {...teams} />;
  }
  const queue = rankQueueFor(queueId);
  const ranks = new Map<string, string | null>();
  for (const [puuid, list] of entries) {
    const entry = list.find((candidate) => candidate.queueType === queue);
    ranks.set(puuid, entry ? rankLabel(entry.tier, entry.rank) : null);
  }
  return <Teams {...teams} ranks={ranks} />;
}

function BackLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"
    >
      <ArrowLeft aria-hidden className="size-4" />
      {copy.back}
    </Link>
  );
}
