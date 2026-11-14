import { Panel, SectionHeading } from "@/components/ui/panel";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatInteger, formatPercent, formatShortDate } from "@/lib/format";
import type { Calendar, CalendarDay, SessionSplit } from "@/lib/stats/regularity";

const copy = t.progression.regularity;

/** Semaines montrées au téléphone : six mois tiennent dans la largeur sans défiler. */
const PHONE_WEEKS = 26;

/**
 * Intensité d'une journée, en crème plus ou moins dense : le corail reste au
 * coach, le vert et le rouge aux victoires et aux défaites.
 */
const LEVEL_CLASS: Record<CalendarDay["level"], string> = {
  0: "bg-raised",
  1: "bg-ink/20",
  2: "bg-ink/40",
  3: "bg-ink/65",
  4: "bg-ink/90",
};

/** « nov. » : le mois d'une date posée à midi UTC. */
const month = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

/**
 * La régularité du joueur : une case par jour sur un an, ses séries, et son
 * winrate selon le rang de la partie dans la journée.
 */
export function PlayCalendar({
  calendar,
  split,
}: {
  calendar: Calendar;
  split: SessionSplit | null;
}) {
  const { weeks } = calendar;
  const firstPhoneWeek = weeks.length - PHONE_WEEKS;
  const onPhone = (week: number) => week >= firstPhoneWeek;
  // Le libellé d'un mois se pose sur la semaine où il commence.
  const monthStarts = weeks.map((days, index) => {
    const previous = weeks[index - 1]?.[0];
    const first = days[0]!;
    return !previous || previous.date.getUTCMonth() !== first.date.getUTCMonth()
      ? month.format(first.date)
      : null;
  });

  const figures = [
    { label: copy.activeDays, value: formatInteger(calendar.activeDays) },
    { label: copy.games, value: formatInteger(calendar.games) },
    {
      label: copy.longestStreak,
      value: `${formatInteger(calendar.longestStreak)} ${copy.days(calendar.longestStreak)}`,
    },
    {
      label: copy.currentStreak,
      value: `${formatInteger(calendar.currentStreak)} ${copy.days(calendar.currentStreak)}`,
    },
  ];

  const columns =
    "grid-cols-[2.25rem_repeat(26,minmax(0,1fr))] sm:grid-cols-[2.25rem_repeat(53,minmax(0,1fr))]";

  return (
    <section aria-labelledby="regularity-title" className="flex flex-col gap-4">
      <SectionHeading id="regularity-title" title={copy.title} description={copy.body} />

      <Panel className="flex flex-col gap-5 p-4 sm:p-5">
        {calendar.games === 0 ? (
          <p className="text-ink-muted">{copy.empty}</p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {figures.map((figure) => (
              <div key={figure.label} className="flex flex-col-reverse gap-0.5">
                <dt className="text-sm text-ink-muted">{figure.label}</dt>
                <dd className="display text-2xl text-ink tabular">{figure.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <figure className="flex flex-col gap-2">
          {/* Une seule image pour les lecteurs d'écran : les chiffres au-dessus disent l'essentiel. */}
          <div role="img" aria-label={copy.calendar} className="flex flex-col gap-1">
            <div aria-hidden className={cn("grid gap-[3px]", columns)}>
              <span />
              {monthStarts.map((label, week) => (
                <span
                  key={weeks[week]![0]!.key}
                  className={cn(
                    "overflow-visible text-[0.6875rem] whitespace-nowrap text-ink-faint",
                    !onPhone(week) && "max-sm:hidden",
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
            <div aria-hidden className={cn("grid grid-flow-col grid-rows-7 gap-[3px]", columns)}>
              {copy.weekdays.map((day, index) => (
                <span
                  key={index}
                  className="self-center text-[0.6875rem] leading-none text-ink-faint"
                >
                  {day}
                </span>
              ))}
              {weeks.flatMap((days, week) =>
                days.map((day) => (
                  <span
                    key={day.key}
                    title={
                      day.future
                        ? undefined
                        : copy.day(formatShortDate(day.date), day.games, day.wins)
                    }
                    className={cn(
                      "aspect-square rounded-[2px]",
                      LEVEL_CLASS[day.level],
                      day.future && "invisible",
                      !onPhone(week) && "max-sm:hidden",
                    )}
                  />
                )),
              )}
            </div>
          </div>
          <figcaption
            aria-hidden
            className="flex items-center justify-end gap-1.5 text-[0.6875rem] text-ink-faint"
          >
            {copy.less}
            {([0, 1, 2, 3, 4] as const).map((level) => (
              <span key={level} className={cn("size-2.5 rounded-[2px]", LEVEL_CLASS[level])} />
            ))}
            {copy.more}
          </figcaption>
        </figure>

        {calendar.games > 0 ? <SessionRecord split={split} /> : null}
      </Panel>
    </section>
  );
}

/** Les premières parties de la journée face aux suivantes, et l'écart en clair. */
function SessionRecord({ split }: { split: SessionSplit | null }) {
  if (!split) {
    return (
      <p className="border-t border-line pt-4 text-sm text-ink-muted">{copy.session.waiting}</p>
    );
  }
  const early = split.early.wins / split.early.games;
  const late = split.late.wins / split.late.games;
  const sides = [
    { label: copy.session.early, ratio: early, games: split.early.games },
    { label: copy.session.late, ratio: late, games: split.late.games },
  ];

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 className="font-semibold text-ink">{copy.session.title}</h3>
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {sides.map((side) => (
          <div key={side.label} className="flex flex-col gap-1.5">
            <dt className="text-sm text-ink-muted">{side.label}</dt>
            <dd className="flex flex-col gap-1.5">
              <span className="display text-2xl text-ink tabular">{formatPercent(side.ratio)}</span>
              {/* La barre suit le winrate ; 50 % est marqué pour situer l'équilibre. */}
              <span aria-hidden className="relative h-1.5 overflow-hidden rounded-pill bg-raised">
                <span
                  className="absolute inset-y-0 left-0 rounded-pill bg-ink/70"
                  style={{ width: `${Math.round(side.ratio * 100)}%` }}
                />
                <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
              </span>
              <span className="text-sm text-ink-faint">{copy.session.record(side.games)}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-ink">{copy.session.verdict(Math.round((late - early) * 100))}</p>
    </div>
  );
}
