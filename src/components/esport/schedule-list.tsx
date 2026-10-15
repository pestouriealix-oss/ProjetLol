import { ArrowUpRight } from "lucide-react";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { groupByDay, matchSides, matchState, type MatchSide } from "@/lib/esport/competitions";
import type { EsportMatch } from "@/lib/esport/schemas";
import { DISPLAY_TIME_ZONE, formatDayHeading } from "@/lib/format";

import { MatchWhen } from "./match-card";
import { TeamLogo } from "./team-logo";

const copy = t.esport.schedule;

/** Le lien de diffusion à proposer : l'officiel principal, à défaut le premier. */
function streamUrl(match: EsportMatch): string | null {
  const streams = match.streams_list.filter((stream) => stream.raw_url);
  const main =
    streams.find((stream) => stream.main && stream.official) ??
    streams.find((stream) => stream.official) ??
    streams[0];
  return main?.raw_url ?? null;
}

/**
 * Le calendrier d'une étape, jour par jour, à l'heure de Paris. Chaque ligne
 * se lit comme un tableau d'affichage : heure, équipes face à face, score.
 */
export function ScheduleList({ matches, now }: { matches: EsportMatch[]; now: Date }) {
  if (matches.length === 0) {
    return <p className="text-ink-muted">{copy.empty}</p>;
  }
  const days = groupByDay(matches, DISPLAY_TIME_ZONE);
  return (
    <div className="flex flex-col gap-5">
      {days.map(({ day, matches: dayMatches }) => (
        <section key={day ?? "sans-date"} className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-ink-muted">
            {day ? formatDayHeading(day, now, copy) : copy.undated}
          </h4>
          <ul className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface">
            {dayMatches.map((match) => (
              <ScheduleRow key={match.id} match={match} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ScheduleRow({ match }: { match: EsportMatch }) {
  const [a, b] = matchSides(match);
  const state = matchState(match);
  const finished = state === "finished";
  // Un lien de diffusion n'a de sens qu'une fois les deux équipes connues.
  const stream =
    (state === "live" || state === "upcoming") && a.team && b.team ? streamUrl(match) : null;
  const label = copy.versus(a.team?.name ?? copy.tbd, b.team?.name ?? copy.tbd);
  return (
    <li className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 sm:grid-cols-[4.5rem_minmax(0,1fr)_7rem] sm:px-4">
      <span className="text-sm text-ink-muted">
        <MatchWhen match={match} />
      </span>
      <p
        aria-label={label}
        className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3"
      >
        <Side side={a} align="end" dim={finished && !a.isWinner} />
        <span className="display text-xl text-ink tabular">
          {a.score !== null && b.score !== null ? (
            <>
              <span className={cn(finished && !a.isWinner && "text-ink-faint")}>{a.score}</span>
              <span className="px-1 text-ink-faint">–</span>
              <span className={cn(finished && !b.isWinner && "text-ink-faint")}>{b.score}</span>
            </>
          ) : (
            <span className="text-base text-ink-faint">{copy.bestOf(match.number_of_games)}</span>
          )}
        </span>
        <Side side={b} align="start" dim={finished && !b.isWinner} />
      </p>
      <span className="flex justify-end">
        {stream ? (
          <a
            href={stream}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={copy.watchLabel(label)}
            className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-sm font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:bg-raised hover:text-ink"
          >
            <span className="max-sm:sr-only">{copy.watch}</span>
            <ArrowUpRight aria-hidden className="size-4" />
          </a>
        ) : a.score !== null && b.score !== null ? (
          // Le format, quand le score occupe déjà le centre de la ligne.
          <span className="text-xs text-ink-faint max-sm:hidden">
            {copy.bestOf(match.number_of_games)}
          </span>
        ) : null}
      </span>
    </li>
  );
}

function Side({ side, align, dim }: { side: MatchSide; align: "start" | "end"; dim: boolean }) {
  const name = side.team?.acronym ?? side.team?.name ?? copy.tbd;
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "end" && "flex-row-reverse text-right",
        dim && "opacity-55",
      )}
    >
      {side.team ? (
        <TeamLogo src={side.team.image_url} className="size-6" />
      ) : (
        <span
          aria-hidden
          className="size-6 shrink-0 rounded-full border border-dashed border-line-strong"
        />
      )}
      <span
        title={side.team?.name}
        className={cn(
          "truncate text-sm font-semibold",
          // Sur téléphone, le cercle pointillé suffit à dire « à déterminer ».
          side.team ? "text-ink" : "text-ink-faint max-sm:sr-only",
        )}
      >
        {name}
      </span>
    </span>
  );
}
