import { ChampionIcon } from "@/components/champion/champion-icon";
import { TeamMark } from "@/components/draft/team-mark";
import { RoleGlyph } from "@/components/map/role-glyph";
import { RankBadge, type RankValue } from "@/components/rank/rank-badge";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import type { DetailObjectives, DetailPlayer, DetailTeam } from "@/lib/stats/match-detail";

import { GameIcon } from "./game-icon";

const copy = t.matchDetail;

/** Images et noms du jeu, résolus côté serveur à partir de Data Dragon. */
export type AssetResolver = {
  champion: (championName: string) => { name: string; iconUrl: string | null };
  item: (id: number) => { name: string; iconUrl: string } | null;
  spell: (key: number) => { name: string; iconUrl: string } | null;
  rune: (id: number) => { name: string; iconUrl: string } | null;
};

const OBJECTIVES: (keyof DetailObjectives)[] = ["towers", "dragons", "barons", "heralds", "grubs"];

/**
 * Une équipe de la partie : son bilan (score, or, objectifs), puis ses cinq
 * joueurs. Sur grand écran, un tableau à colonnes comme sur les sites de
 * statistiques ; sur téléphone, une ligne compacte par joueur.
 */
/**
 * Classement de chaque joueur, par PUUID : le rang lisible, `null` s'il n'est
 * pas classé dans la file de la partie. Absent : pas encore connu.
 */
export type PlayerRanks = ReadonlyMap<string, RankValue | null>;

export function TeamTable({
  team,
  maxDamage,
  durationMinutes,
  assets,
  ranks,
}: {
  team: DetailTeam;
  maxDamage: number;
  durationMinutes: number;
  assets: AssetResolver;
  ranks?: PlayerRanks;
}) {
  const titleId = `equipe-${team.teamId}`;
  const title = team.isMine ? copy.ourTeam : copy.theirTeam;
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 id={titleId} className="flex items-center gap-2 display text-2xl text-ink">
            <TeamMark side={team.isMine ? "ours" : "theirs"} />
            {title}
          </h2>
          <span className={cn("font-semibold", team.win ? "text-win" : "text-loss")}>
            {team.win ? t.matches.win : t.matches.loss}
          </span>
          <span className="text-sm text-ink-faint">
            {team.side === "BLUE" ? copy.blue : copy.red}
          </span>
        </div>
        <dl className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-ink-muted tabular">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{copy.columns.kda}</dt>
            <dd className="display text-xl text-ink">
              {copy.score(team.kills, team.deaths, team.assists)}
            </dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{copy.columns.gold}</dt>
            <dd>{copy.gold(formatInteger(team.gold))}</dd>
          </div>
          {OBJECTIVES.map((objective) => (
            <div key={objective} className="flex items-baseline gap-1.5">
              <dt>{copy.objectives[objective]}</dt>
              <dd className="font-semibold text-ink">{team.objectives[objective]}</dd>
            </div>
          ))}
        </dl>
      </header>

      {/* Grand écran : le tableau complet. */}
      <div className="overflow-hidden rounded-panel border border-line bg-surface max-lg:hidden">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-ink-faint">
              <th scope="col" className="w-[7.75rem] py-2.5 pl-4 font-semibold">
                <span className="sr-only">{copy.columns.player}</span>
              </th>
              <th scope="col" className="py-2.5 pr-3 font-semibold">
                {copy.columns.player}
              </th>
              <th scope="col" className="w-32 py-2.5 pr-3 font-semibold">
                {copy.columns.kda}
              </th>
              <th scope="col" className="w-36 py-2.5 pr-3 font-semibold xl:w-44">
                {copy.columns.damage}
              </th>
              <th scope="col" className="w-20 py-2.5 pr-3 text-right font-semibold">
                {copy.columns.gold}
              </th>
              <th scope="col" className="w-20 py-2.5 pr-3 text-right font-semibold">
                {copy.columns.cs}
              </th>
              <th scope="col" className="w-18 py-2.5 pr-4 text-right font-semibold">
                {copy.columns.vision}
              </th>
              <th scope="col" className="w-[13.25rem] py-2.5 pr-4 font-semibold">
                {copy.columns.items}
              </th>
            </tr>
          </thead>
          <tbody>
            {team.players.map((player) => (
              <PlayerRow
                key={player.puuid}
                player={player}
                rank={ranks?.get(player.puuid)}
                maxDamage={maxDamage}
                durationMinutes={durationMinutes}
                assets={assets}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Téléphone et tablette : une ligne compacte par joueur. */}
      <ul className="flex flex-col gap-1.5 lg:hidden">
        {team.players.map((player) => (
          <PlayerCard
            key={player.puuid}
            player={player}
            rank={ranks?.get(player.puuid)}
            maxDamage={maxDamage}
            assets={assets}
          />
        ))}
      </ul>
    </section>
  );
}

function PlayerRow({
  player,
  rank,
  maxDamage,
  durationMinutes,
  assets,
}: {
  player: DetailPlayer;
  rank: RankValue | null | undefined;
  maxDamage: number;
  durationMinutes: number;
  assets: AssetResolver;
}) {
  return (
    <tr
      className={cn(
        "border-b border-line last:border-b-0",
        // Le joueur se repère à son fond et à son badge, pas à la couleur seule.
        player.isMe && "bg-raised",
      )}
    >
      <td className="py-2.5 pl-4">
        <Loadout player={player} assets={assets} />
      </td>
      <td className="py-2.5 pr-3">
        <PlayerName player={player} rank={rank} assets={assets} />
      </td>
      <td className="py-2.5 pr-3 whitespace-nowrap">
        <Score player={player} />
      </td>
      <td className="py-2.5 pr-3">
        <DamageBar player={player} maxDamage={maxDamage} />
      </td>
      <td className="py-2.5 pr-3 text-right text-ink tabular">{formatInteger(player.gold)}</td>
      <td className="py-2.5 pr-3 text-right whitespace-nowrap tabular">
        <span className="text-ink">{player.cs}</span>
        <span className="block text-xs text-ink-faint">
          {copy.perMinute(formatDecimal(player.cs / Math.max(1, durationMinutes)))}
        </span>
      </td>
      <td
        className="py-2.5 pr-4 text-right text-ink tabular"
        title={copy.wards(player.wardsPlaced, player.controlWards)}
      >
        {player.vision}
      </td>
      <td className="py-2.5 pr-4">
        <Items player={player} assets={assets} />
      </td>
    </tr>
  );
}

function PlayerCard({
  player,
  rank,
  maxDamage,
  assets,
}: {
  player: DetailPlayer;
  rank: RankValue | null | undefined;
  maxDamage: number;
  assets: AssetResolver;
}) {
  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-panel border border-line px-3 py-2.5",
        player.isMe ? "bg-raised" : "bg-surface",
      )}
    >
      <Loadout player={player} assets={assets} />
      <PlayerName player={player} rank={rank} assets={assets} stacked />
      <div className="text-right">
        <Score player={player} />
      </div>
      <div className="col-span-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Items player={player} assets={assets} size="size-5" />
        <div className="w-32">
          <DamageBar player={player} maxDamage={maxDamage} />
        </div>
      </div>
    </li>
  );
}

/** Portrait et niveau, sorts d'invocateur, rune clé et arbre secondaire. */
function Loadout({ player, assets }: { player: DetailPlayer; assets: AssetResolver }) {
  const champion = assets.champion(player.championName);
  const [spellA, spellB] = player.spells.map((key) => assets.spell(key));
  const keystone = player.keystone ? assets.rune(player.keystone) : null;
  const secondary = player.secondaryStyle ? assets.rune(player.secondaryStyle) : null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex shrink-0">
        <ChampionIcon name={champion.name} src={champion.iconUrl} className="size-11" />
        <span
          title={copy.level(player.level)}
          className="absolute -right-1 -bottom-1 grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-canvas px-1 text-[0.6875rem] leading-none font-semibold text-ink tabular ring-1 ring-line-strong"
        >
          <span className="sr-only">{copy.level(player.level)}</span>
          <span aria-hidden>{player.level}</span>
        </span>
      </span>
      <div className="grid grid-cols-2 gap-0.5" aria-label={copy.spells} role="group">
        <GameIcon
          src={spellA?.iconUrl ?? null}
          label={spellA?.name ?? copy.emptySlot}
          className="size-5"
        />
        <GameIcon
          src={keystone?.iconUrl ?? null}
          label={keystone?.name ?? copy.runes}
          className="size-5 bg-canvas"
          round
        />
        <GameIcon
          src={spellB?.iconUrl ?? null}
          label={spellB?.name ?? copy.emptySlot}
          className="size-5"
        />
        <span className="grid size-5 place-items-center">
          <GameIcon
            src={secondary?.iconUrl ?? null}
            label={secondary?.name ?? copy.runes}
            className="size-3.5 bg-transparent"
            round
          />
        </span>
      </div>
    </div>
  );
}

function PlayerName({
  player,
  rank,
  assets,
  stacked = false,
}: {
  player: DetailPlayer;
  rank: RankValue | null | undefined;
  assets: AssetResolver;
  /** Carte de téléphone : le rang sur sa propre ligne, réservée d'avance. */
  stacked?: boolean;
}) {
  const champion = assets.champion(player.championName);
  const rankText =
    rank === undefined ? null : (
      <span title={copy.rank.hint}>
        <RankBadge rank={rank} unranked={copy.rank.unranked} emblemClassName="h-4" />
      </span>
    );
  return (
    <div className="min-w-0">
      <p className="flex min-w-0 items-baseline gap-1.5">
        <span className="min-w-0 truncate font-semibold text-ink">
          {player.riotId?.gameName ?? copy.unknownPlayer}
        </span>
        {player.riotId?.tagLine ? (
          <span className="shrink-0 text-sm text-ink-faint max-sm:hidden">
            #{player.riotId.tagLine}
          </span>
        ) : null}
        {player.isMe ? (
          <Badge className="ml-0.5 shrink-0 self-center bg-ink text-canvas">{copy.you}</Badge>
        ) : null}
      </p>
      <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink-muted">
        {player.role ? <RoleGlyph role={player.role} className="size-3.5" /> : null}
        <span className="truncate">{champion.name}</span>
        {rankText && !stacked ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <span aria-hidden className="text-ink-faint">
              ·
            </span>
            {rankText}
          </span>
        ) : null}
      </p>
      {stacked ? <p className="h-4 truncate text-xs leading-4">{rankText}</p> : null}
    </div>
  );
}

function Score({ player }: { player: DetailPlayer }) {
  return (
    <>
      <p className="display text-lg text-ink tabular">
        {player.kills} <span className="text-ink-faint">/</span>{" "}
        <span className="text-loss">{player.deaths}</span> <span className="text-ink-faint">/</span>{" "}
        {player.assists}
      </p>
      <p className="text-xs text-ink-muted tabular">
        {t.matches.kda(formatDecimal(player.kda))}
        <span aria-hidden> · </span>
        {copy.kp(formatPercent(player.killParticipation))}
      </p>
    </>
  );
}

function DamageBar({ player, maxDamage }: { player: DetailPlayer; maxDamage: number }) {
  const ratio = Math.min(1, player.damage / Math.max(1, maxDamage));
  return (
    <div title={copy.damageShare(formatPercent(player.damageShare))}>
      <p className="text-sm text-ink tabular">{formatInteger(player.damage)}</p>
      <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-pill bg-field">
        <div
          className={cn("h-full rounded-pill", player.isMe ? "bg-ink" : "bg-ink-faint/70")}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Items({
  player,
  assets,
  size = "size-6",
}: {
  player: DetailPlayer;
  assets: AssetResolver;
  size?: string;
}) {
  const trinket = player.trinket ? assets.item(player.trinket) : null;
  return (
    <div role="group" aria-label={copy.columns.items} className="flex items-center gap-0.5">
      {player.items.map((id, slot) => {
        const item = id ? assets.item(id) : null;
        return (
          <GameIcon
            key={slot}
            src={item?.iconUrl ?? null}
            label={item?.name ?? copy.emptySlot}
            className={size}
          />
        );
      })}
      <GameIcon
        src={trinket?.iconUrl ?? null}
        label={trinket?.name ?? copy.trinket}
        className={cn(size, "ml-1")}
        round
      />
    </div>
  );
}
