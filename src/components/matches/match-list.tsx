import { ChampionIcon } from "@/components/champion/champion-icon";
import { RoleGlyph } from "@/components/map/role-glyph";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { ChampionAssets } from "@/lib/ddragon/champions";
import type { PlayedMatch } from "@/lib/db/matches";
import { formatDecimal, formatDuration, formatPercent, formatRelative } from "@/lib/format";
import { kdaRatio, rankedQueue } from "@/lib/stats/participation";

const copy = t.matches;

/**
 * Liste de parties, une ligne par partie, à lire de gauche à droite comme sur
 * les sites de statistiques : résultat, champion, score, détails, date. Le
 * résultat se lit à la barre de gauche et à son libellé, pas à la couleur seule.
 */
export function MatchList({
  matches,
  champions,
}: {
  matches: PlayedMatch[];
  champions: ChampionAssets | null;
}) {
  const now = new Date();
  return (
    <ul className="flex flex-col gap-2">
      {matches.map((match) => {
        const name = champions?.name(match.championName) ?? match.championName;
        const queue = rankedQueue(match.queueId) ?? "OTHER";
        const minutes = Math.max(1, match.durationSeconds / 60);
        return (
          <li
            key={match.id}
            className="flex items-center gap-3 rounded-panel border border-line bg-surface px-3 py-3 sm:gap-4 sm:px-4"
          >
            <span
              aria-hidden
              className={cn(
                "h-10 w-1 shrink-0 -skew-x-[14deg] rounded-[1px]",
                match.win ? "bg-win" : "bg-loss",
              )}
            />
            <ChampionIcon
              name={name}
              src={champions?.iconUrl(match.championName) ?? null}
              className="size-11"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate display-name text-xl text-ink">{name}</p>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted">
                <span className={cn("font-semibold", match.win ? "text-win" : "text-loss")}>
                  {match.win ? copy.win : copy.loss}
                </span>
                <span aria-hidden>·</span>
                {match.role ? <RoleGlyph role={match.role} className="size-3.5" /> : null}
                <span className="truncate">
                  {match.role ? `${t.roles[match.role]} · ` : ""}
                  {copy.queues[queue]}
                </span>
              </p>
            </div>
            <div className="shrink-0 max-sm:text-right sm:w-28">
              <p className="display text-xl text-ink tabular">
                {match.kills} <span className="text-ink-faint">/</span>{" "}
                <span className="text-loss">{match.deaths}</span>{" "}
                <span className="text-ink-faint">/</span> {match.assists}
              </p>
              <p className="text-sm text-ink-muted tabular">
                {copy.kda(formatDecimal(kdaRatio(match.kills, match.deaths, match.assists)))}
              </p>
              {/* Sur téléphone, la date tient ici : la colonne de droite est masquée. */}
              <p className="text-xs text-ink-faint sm:hidden">
                {formatRelative(match.startedAt, now)}
              </p>
            </div>
            <div className="w-44 shrink-0 text-sm text-ink-muted tabular max-lg:hidden">
              <p>{copy.cs(match.cs, formatDecimal(match.cs / minutes))}</p>
              <p>{copy.killParticipation(formatPercent(match.killParticipation))}</p>
            </div>
            <div className="w-28 shrink-0 text-right text-sm text-ink-muted tabular max-sm:hidden">
              <p className="text-ink">{formatDuration(match.durationSeconds)}</p>
              <p>{formatRelative(match.startedAt, now)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
