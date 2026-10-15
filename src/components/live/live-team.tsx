import { ChampionIcon } from "@/components/champion/champion-icon";
import { TeamMark } from "@/components/draft/team-mark";
import { GameIcon } from "@/components/match-detail/game-icon";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import type { LivePlayer, LiveTeam } from "@/lib/stats/live-game";

const copy = t.live;
const tiers = t.dashboard.rank.tiers;
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** Images et noms du jeu, résolus côté serveur à partir de Data Dragon. */
export type LiveAssets = {
  champion: (key: number) => { name: string; iconUrl: string | null };
  spell: (key: number) => { name: string; iconUrl: string } | null;
  rune: (id: number) => { name: string; iconUrl: string } | null;
};

/**
 * Une équipe de la partie en cours : ses bannissements, puis ses cinq joueurs
 * avec champion, sorts, runes et classement officiel. Aucune estimation de
 * niveau caché : seulement ce que Riot publie.
 */
export function LiveTeamSection({ team, assets }: { team: LiveTeam; assets: LiveAssets }) {
  const titleId = `live-${team.teamId}`;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <h2 id={titleId} className="flex items-baseline gap-3">
          <span className="flex items-center gap-2 display text-2xl text-ink">
            <TeamMark side={team.isMine ? "ours" : "theirs"} />
            {team.isMine ? copy.ourTeam : copy.theirTeam}
          </span>
          <span className="text-sm text-ink-faint">
            {team.side === "BLUE" ? copy.blue : copy.red}
          </span>
        </h2>
        {team.bans.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-faint">{copy.bans}</span>
            <ul className="flex gap-1">
              {team.bans.map((key, index) => {
                const champion = assets.champion(key);
                return (
                  <li key={`${key}-${index}`} title={champion.name} className="grayscale">
                    <ChampionIcon name={champion.name} src={champion.iconUrl} className="size-7" />
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </header>
      <ul className="flex flex-col gap-1.5">
        {team.players.map((player, index) => (
          <PlayerRow key={player.puuid ?? index} player={player} assets={assets} />
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({ player, assets }: { player: LivePlayer; assets: LiveAssets }) {
  const champion = assets.champion(player.championKey);
  const [spellA, spellB] = player.spells.map((key) => assets.spell(key));
  const keystone = player.keystone ? assets.rune(player.keystone) : null;
  const secondary = player.secondaryStyle ? assets.rune(player.secondaryStyle) : null;
  const rank = player.rank;
  const games = rank ? rank.wins + rank.losses : 0;
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-panel border border-line px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_14rem] sm:px-4",
        player.isMe ? "bg-raised" : "bg-surface",
      )}
    >
      <div className="flex items-center gap-1.5">
        <ChampionIcon name={champion.name} src={champion.iconUrl} className="size-12" />
        <div className="grid grid-cols-2 gap-0.5">
          <GameIcon src={spellA?.iconUrl ?? null} label={spellA?.name ?? ""} className="size-5" />
          <GameIcon
            src={keystone?.iconUrl ?? null}
            label={keystone?.name ?? ""}
            className="size-5 bg-canvas"
            round
          />
          <GameIcon src={spellB?.iconUrl ?? null} label={spellB?.name ?? ""} className="size-5" />
          <span className="grid size-5 place-items-center">
            <GameIcon
              src={secondary?.iconUrl ?? null}
              label={secondary?.name ?? ""}
              className="size-3.5 bg-transparent"
              round
            />
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 truncate font-semibold text-ink">
            {player.riotId?.gameName ?? (player.puuid ? copy.hiddenPlayer : copy.bot)}
          </span>
          {player.riotId?.tagLine ? (
            <span className="shrink-0 text-sm text-ink-faint max-sm:hidden">
              #{player.riotId.tagLine}
            </span>
          ) : null}
          {player.isMe ? (
            <Badge className="shrink-0 self-center bg-ink text-canvas">{copy.you}</Badge>
          ) : null}
        </p>
        <p className="truncate text-sm text-ink-muted">{champion.name}</p>
      </div>
      <div className="col-span-2 sm:col-span-1 sm:text-right">
        {rank ? (
          <>
            <p className="display text-lg text-ink">
              {copy.rank(
                `${tiers[rank.tier] ?? rank.tier}${APEX_TIERS.has(rank.tier) ? "" : ` ${rank.division}`}`,
                rank.lp,
              )}
            </p>
            {games > 0 ? (
              <p className="text-xs text-ink-muted tabular">
                {copy.record(formatPercent(rank.wins / games), games)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-faint">{copy.unranked}</p>
        )}
      </div>
    </li>
  );
}
