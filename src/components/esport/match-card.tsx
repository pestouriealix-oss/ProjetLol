import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { matchSides, matchState, type MatchSide } from "@/lib/esport/competitions";
import type { EsportMatch } from "@/lib/esport/schemas";
import { formatShortDate, formatTime } from "@/lib/format";

import { TeamLogo } from "./team-logo";

const copy = t.esport.schedule;

/** Nom d'une équipe pour un lecteur d'écran, ou « À déterminer ». */
const teamName = (side: MatchSide) => side.team?.name ?? copy.tbd;

/** Moment du match : « En direct », sinon l'heure (et la date si `withDate`). */
export function MatchWhen({ match, withDate = false }: { match: EsportMatch; withDate?: boolean }) {
  const state = matchState(match);
  if (state === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap text-warn">
        <span
          aria-hidden
          className="size-1.5 animate-pulse rounded-full bg-warn motion-reduce:animate-none"
        />
        {copy.live}
      </span>
    );
  }
  if (state === "canceled") return <span>{copy.canceled}</span>;
  const when = match.begin_at ?? match.scheduled_at;
  if (!when) return <span>{copy.undated}</span>;
  const date = new Date(when);
  return (
    <time dateTime={date.toISOString()} className="tabular">
      {withDate ? `${formatShortDate(date)} · ` : ""}
      {formatTime(date)}
    </time>
  );
}

/**
 * Un match dans une case d'arbre : les deux équipes l'une sous l'autre, leur
 * score, le vainqueur en clair et le perdant en retrait.
 */
export function MatchCard({ match, className }: { match: EsportMatch; className?: string }) {
  const sides = matchSides(match);
  const finished = matchState(match) === "finished";
  return (
    <article
      aria-label={copy.versus(teamName(sides[0]), teamName(sides[1]))}
      className={cn("w-52 rounded-control border border-line bg-surface", className)}
    >
      <header className="flex items-center justify-between border-b border-line px-2.5 py-1 text-[0.6875rem] text-ink-faint">
        <MatchWhen match={match} withDate />
        <span>{copy.bestOf(match.number_of_games)}</span>
      </header>
      <ul>
        {sides.map((side, index) => (
          <li
            key={index}
            className={cn(
              "flex h-9 items-center gap-2 px-2.5",
              index === 0 && "border-b border-line/60",
              finished && !side.isWinner && "opacity-55",
            )}
          >
            {side.team ? (
              <TeamLogo src={side.team.image_url} className="size-5" />
            ) : (
              <span
                aria-hidden
                className="size-5 shrink-0 rounded-full border border-dashed border-line-strong"
              />
            )}
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-sm",
                side.team ? "font-semibold text-ink" : "text-ink-faint",
              )}
            >
              {side.team?.acronym ?? side.team?.name ?? copy.tbd}
            </span>
            <span
              className={cn(
                "display text-lg tabular",
                side.isWinner ? "text-ink" : "text-ink-muted",
              )}
            >
              {side.score ?? ""}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
