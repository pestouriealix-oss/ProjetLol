import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageShell } from "@/components/layout/page-shell";
import { RefreshButton } from "@/components/live/refresh-button";
import { MatchList } from "@/components/matches/match-list";
import { MatchListEmpty } from "@/components/matches/match-list-empty";
import { PlayerHeader } from "@/components/player/player-header";
import { PlayerSearchForm } from "@/components/player/player-search-form";
import { ChampionRecords } from "@/components/profile/champion-records";
import { RankCard } from "@/components/profile/rank-card";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { PLATFORMS } from "@/lib/config";
import { championSplashUrl, getChampionAssets } from "@/lib/ddragon/champions";
import { listRiotAccounts } from "@/lib/db/riot-accounts";
import { formatRelative } from "@/lib/format";
import { lookUpPlayer, type ProfileFailure } from "@/lib/players";
import { PROFILE_MATCHES } from "@/lib/players/profile";
import { canonicalPlayerPath, isSameRiotId, parsePlayerPath } from "@/lib/players/slug";
import { isRiotApiConfigured } from "@/lib/riot";
import { formatRiotId } from "@/lib/validation/riot";

const copy = t.player;

type PlayerParams = Promise<{ server: string; riotId: string }>;

export async function generateMetadata({ params }: { params: PlayerParams }): Promise<Metadata> {
  const { server, riotId } = await params;
  const target = parsePlayerPath(server, riotId);
  return { title: target ? formatRiotId(target.riotId) : copy.title };
}

export default async function PlayerPage({ params }: { params: PlayerParams }) {
  const user = await requireUser();
  const { server, riotId: slug } = await params;
  const target = parsePlayerPath(server, slug);
  if (!target) notFound();
  const { platform, riotId } = target;
  const display = formatRiotId(riotId);

  if (!isRiotApiConfigured) return <Failure title={copy.errorTitle} reason="missing_key" />;

  const [result, accounts] = await Promise.all([
    lookUpPlayer(user.id, platform, riotId),
    listRiotAccounts(user.id),
  ]);

  if (!result.ok) {
    if (result.reason !== "not_found") {
      return <Failure title={copy.errorTitle} reason={result.reason} />;
    }
    return (
      <PageShell route="player" title={copy.notFoundTitle}>
        <Panel className="flex max-w-3xl flex-col gap-5 p-5 sm:p-6">
          <div>
            <h2 className="display text-2xl text-ink">{copy.notFoundTitle}</h2>
            <p className="mt-1 text-ink-muted">
              {copy.notFoundBody(display, PLATFORMS[platform].short)}
            </p>
          </div>
          <PlayerSearchForm defaultQuery={display} defaultPlatform={platform} />
        </Panel>
      </PageShell>
    );
  }

  const { profile } = result;
  // « faker-kr1 » devient « Faker-KR1 » : une seule adresse par joueur.
  const canonical = canonicalPlayerPath(target, profile.riotId);
  if (canonical) redirect(canonical);

  const champions = await getChampionAssets();
  // Un compte pas encore synchronisé n'a pas d'identifiant Riot : on le reconnaît à son Riot ID.
  const own = accounts.find((account) =>
    account.puuid
      ? account.puuid === profile.puuid
      : account.platform === platform && isSameRiotId(account, profile.riotId),
  );
  const top = profile.champions[0];

  return (
    <PageShell
      route="player"
      title={formatRiotId(profile.riotId)}
      header={
        <PlayerHeader
          riotId={profile.riotId}
          platform={platform}
          iconUrl={champions?.profileIconUrl(profile.profileIconId) ?? null}
          level={profile.level}
          roles={profile.roles}
          backdrop={top ? championSplashUrl(top.championName) : null}
          loadedAt={copy.loadedAt(formatRelative(profile.loadedAt))}
          ownAccountId={own?.id ?? null}
        />
      }
    >
      {profile.partial ? (
        <p
          role="status"
          className="rounded-control border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-ink"
        >
          {copy.partial}
        </p>
      ) : null}
      {/* Même disposition que le tableau de bord : l'état du compte à gauche, les parties à droite. */}
      <div className="grid items-start gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 max-lg:order-2">
          <RankCard ranks={profile.ranks} synced />
          <ChampionRecords
            records={profile.champions}
            champions={champions}
            emptyText={copy.champions.empty}
          />
        </div>
        <section aria-labelledby="player-recent" className="flex min-w-0 flex-col gap-4">
          <div>
            <h2 id="player-recent" className="display text-2xl text-ink">
              {copy.recent.title}
            </h2>
            <p className="text-sm text-ink-muted">{copy.recent.hint(PROFILE_MATCHES)}</p>
          </div>
          {profile.matches.length === 0 ? (
            <MatchListEmpty title={copy.recent.emptyTitle} body={copy.recent.emptyBody} />
          ) : (
            <MatchList matches={profile.matches} champions={champions} linked={false} />
          )}
        </section>
      </div>
    </PageShell>
  );
}

/** Riot n'a rien rendu (ou la limite du compte est atteinte) : la raison, et de quoi réessayer. */
function Failure({
  title,
  reason,
}: {
  title: string;
  reason: Exclude<ProfileFailure, "not_found">;
}) {
  return (
    <PageShell route="player" title={title}>
      <div className="flex max-w-2xl flex-col items-start gap-4">
        <h2 className="display text-2xl text-ink">{title}</h2>
        <ErrorNotice className="w-full">{copy.errors[reason]}</ErrorNotice>
        {reason === "rate_limited" || reason === "unavailable" ? (
          <RefreshButton label={copy.retry} />
        ) : null}
      </div>
    </PageShell>
  );
}
