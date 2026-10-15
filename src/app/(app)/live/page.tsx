import type { Metadata } from "next";
import type { ReactNode } from "react";

import { GameClock } from "@/components/live/game-clock";
import { LiveTeamSection, type LiveAssets } from "@/components/live/live-team";
import { RefreshButton } from "@/components/live/refresh-button";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import { getChampionAssets } from "@/lib/ddragon/champions";
import { getGameAssets } from "@/lib/ddragon/game-assets";
import { loadLiveGame } from "@/lib/live";
import { isRiotApiConfigured, RiotApiError } from "@/lib/riot";
import type { LiveGame } from "@/lib/stats/live-game";

import { getSelectedAccount, type AccountSearchParams } from "../selected-account";

export const metadata: Metadata = { title: t.live.title };

const copy = t.live;

export default async function LivePage({ searchParams }: { searchParams: AccountSearchParams }) {
  const user = await requireUser();
  const { account } = await getSelectedAccount(user.id, searchParams);

  if (!account) {
    return (
      <PageShell route="live" title={copy.title}>
        <Message
          title={copy.title}
          body={copy.noAccountBody}
          action={
            <Button asChild>
              <Link href="/settings">{t.matches.noAccountAction}</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }
  if (!isRiotApiConfigured) {
    return (
      <PageShell route="live" title={copy.title}>
        <ErrorNotice>{copy.errors.missing_key}</ErrorNotice>
      </PageShell>
    );
  }
  if (!account.puuid) {
    return (
      <PageShell route="live" title={copy.title}>
        <Message
          title={copy.unverifiedTitle}
          body={copy.unverifiedBody}
          action={
            <Button asChild variant="secondary">
              <Link href={`/dashboard?compte=${account.id}`}>{copy.toDashboard}</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  let game: LiveGame | null;
  try {
    game = await loadLiveGame(account.platform, account.puuid);
  } catch (error) {
    if (!(error instanceof RiotApiError)) throw error;
    return (
      <PageShell route="live" title={copy.title} aside={<RefreshButton label={copy.refresh} />}>
        <div>
          <h2 className="display text-2xl text-ink">{copy.errorTitle}</h2>
          <ErrorNotice className="mt-3">{copy.errors[error.kind]}</ErrorNotice>
        </div>
      </PageShell>
    );
  }

  const riotId = `${account.gameName}#${account.tagLine}`;
  if (!game) {
    return (
      <PageShell route="live" title={copy.title}>
        <Message
          title={copy.notInGameTitle}
          body={copy.notInGameBody(riotId)}
          action={<RefreshButton label={copy.refresh} />}
        />
      </PageShell>
    );
  }

  const [champions, assets] = await Promise.all([getChampionAssets(), getGameAssets()]);
  const resolve: LiveAssets = {
    champion: (key) => {
      const champion = champions?.byKey(key);
      return { name: champion?.name ?? String(key), iconUrl: champion?.iconUrl ?? null };
    },
    spell: (key) => assets?.spell(key) ?? null,
    rune: (id) => assets?.rune(id) ?? null,
  };

  return (
    <PageShell route="live" title={copy.title} aside={<RefreshButton label={copy.refresh} />}>
      <p className="-mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-lg text-ink-muted">
        <span className="inline-flex items-center gap-2 font-semibold text-warn">
          <span
            aria-hidden
            className="size-2 animate-pulse rounded-full bg-warn motion-reduce:animate-none"
          />
          {copy.queues[game.queueId] ?? copy.otherQueue}
        </span>
        <span aria-hidden>·</span>
        {game.startedAt ? (
          <span>
            {copy.elapsed}{" "}
            <GameClock
              startedAt={game.startedAt.toISOString()}
              serverNow={new Date().toISOString()}
            />
          </span>
        ) : (
          <span>{copy.loadingScreen}</span>
        )}
      </p>
      {game.teams.map((team) => (
        <LiveTeamSection key={team.teamId} team={team} assets={resolve} />
      ))}
    </PageShell>
  );
}

function Message({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Panel className="flex max-w-2xl flex-col items-start gap-3 p-6">
      <h2 className="display text-2xl text-ink">{title}</h2>
      <p className="text-ink-muted">{body}</p>
      {action}
    </Panel>
  );
}
