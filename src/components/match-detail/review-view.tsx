import type { ReactNode } from "react";

import { Slash } from "@/components/brand/slash";
import { Block, Growing, Lines } from "@/components/coach/writing";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatDecimal, formatPercent, formatSignedInteger } from "@/lib/format";
import type { ReviewView as Review } from "@/lib/review/review-view";
import type { ReviewFacts } from "@/lib/stats/review";

const copy = t.matchDetail.review;

/** En dessous de ces écarts avec le vis-à-vis, c'est l'égalité : pas de couleur. */
const EVEN_GOLD = 250;
const EVEN_CS = 5;
/** Écart avec les habitudes à partir duquel une mesure est colorée (comme dans le prompt). */
const HABIT_GAP = 0.1;

/**
 * Le bilan d'une partie : un résumé, les chiffres sur lesquels il s'appuie,
 * puis les points forts et les axes de progrès, chacun avec plusieurs façons
 * de s'y prendre. Pendant l'écriture, chaque texte grandit à sa place.
 */
export function ReviewView({ review, writing = false }: { review: Review; writing?: boolean }) {
  const strengths = review.strengths ?? [];
  const improvements = review.improvements ?? [];

  return (
    <article className="flex flex-col gap-6" aria-busy={writing}>
      <Growing text={review.summary} writing={writing} className="text-lg text-ink" lines={2} />

      {review.focus || writing ? (
        <div className="flex gap-3 rounded-control border border-accent/40 bg-accent-soft px-4 py-3">
          <Slash className="mt-[0.3em] h-[0.9em] text-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.04em] text-accent uppercase">
              {copy.focus}
            </p>
            <Growing
              text={review.focus}
              writing={writing}
              className="font-semibold text-ink"
              lines={1}
            />
          </div>
        </div>
      ) : null}

      {review.facts ? <FactsStrip facts={review.facts} /> : writing ? <Lines count={2} /> : null}

      <div className="grid gap-6 md:grid-cols-2">
        {strengths.length > 0 || writing ? (
          <Block label={copy.strengths}>
            {strengths.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {strengths.map((point, index) => (
                  <li key={index} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-win"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{point.title ?? ""}</p>
                      <Growing
                        text={point.detail}
                        writing={writing}
                        className="text-ink-muted"
                        lines={1}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : writing ? (
              <Lines count={3} />
            ) : null}
          </Block>
        ) : null}

        <Block label={copy.improvements}>
          {improvements.length > 0 ? (
            <ol className="flex flex-col gap-5">
              {improvements.map((point, index) => (
                <li key={index} className="flex flex-col gap-2">
                  <div>
                    <p className="font-semibold text-ink">{point.title ?? ""}</p>
                    <Growing
                      text={point.detail}
                      writing={writing}
                      className="text-ink-muted"
                      lines={1}
                    />
                  </div>
                  {point.options && point.options.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs font-semibold text-ink-faint">{copy.options}</p>
                      <ul className="flex flex-col gap-1.5">
                        {point.options.map((option, optionIndex) => (
                          <li key={optionIndex} className="flex gap-2.5 text-ink">
                            <Slash className="mt-[0.3em] h-[0.85em] text-accent" />
                            <span className="min-w-0 text-pretty">
                              <span className="sr-only">{copy.option(optionIndex + 1)}</span>
                              {option}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : writing ? (
                    <Lines count={2} />
                  ) : null}
                </li>
              ))}
            </ol>
          ) : writing ? (
            <Lines count={4} />
          ) : null}
        </Block>
      </div>

      {review.facts ? (
        <footer className="border-t border-line pt-3 text-xs text-ink-faint">
          {copy.sources(review.facts.habits?.games ?? 0)}
        </footer>
      ) : null}
    </article>
  );
}

/** Les chiffres clés de la partie, comparés au vis-à-vis et aux habitudes du joueur. */
export function FactsStrip({ facts }: { facts: ReviewFacts }) {
  const { habits } = facts;
  const cells: { label: string; value: ReactNode; note?: string }[] = [
    ...facts.lane.map((checkpoint) => ({
      label: copy.facts.lane(checkpoint.minute),
      value: (
        <>
          <Signed value={checkpoint.goldDiff} even={EVEN_GOLD}>
            {copy.facts.gold(formatSignedInteger(checkpoint.goldDiff))}
          </Signed>
          <span className="text-ink-faint"> · </span>
          <Signed value={checkpoint.csDiff} even={EVEN_CS}>
            {copy.facts.cs(formatSignedInteger(checkpoint.csDiff))}
          </Signed>
        </>
      ),
    })),
    ...(facts.impact && facts.impact.goldDiffEnd !== null
      ? [
          {
            label: copy.facts.goldEnd,
            value: (
              <Signed value={facts.impact.goldDiffEnd} even={EVEN_GOLD}>
                {copy.facts.gold(formatSignedInteger(facts.impact.goldDiffEnd))}
              </Signed>
            ),
          },
        ]
      : []),
    ...(facts.impact?.takedownsBefore15
      ? [
          {
            label: copy.facts.takedowns,
            value: (
              <Signed
                value={
                  facts.impact.takedownsBefore15.me - (facts.impact.takedownsBefore15.opponent ?? 0)
                }
                even={facts.impact.takedownsBefore15.opponent === null ? Infinity : 2}
              >
                {facts.impact.takedownsBefore15.me}
              </Signed>
            ),
            note:
              facts.impact.takedownsBefore15.opponent !== null
                ? copy.facts.versus(facts.impact.takedownsBefore15.opponent)
                : undefined,
          },
        ]
      : []),
    ...(facts.deaths.times.length > 0
      ? [
          {
            label: copy.facts.deaths,
            value: String(facts.deaths.beforeMinute15),
            note:
              facts.deaths.beforeEnemyObjective > 0
                ? copy.facts.deathsObjective(facts.deaths.beforeEnemyObjective)
                : undefined,
          },
        ]
      : []),
    ...(facts.me.objectiveTakedowns
      ? [
          {
            label: copy.facts.objectives,
            value: copy.facts.objectivesValue(
              facts.me.objectiveTakedowns.dragons,
              facts.me.objectiveTakedowns.barons,
              facts.me.objectiveTakedowns.towers,
            ),
          },
        ]
      : []),
    {
      label: copy.facts.csPerMinute,
      value: (
        <VersusHabit value={facts.me.csPerMinute} habit={habits?.csPerMinute}>
          {formatDecimal(facts.me.csPerMinute)}
        </VersusHabit>
      ),
      note: habits ? copy.facts.habit(formatDecimal(habits.csPerMinute)) : undefined,
    },
    {
      label: copy.facts.killParticipation,
      value: (
        <VersusHabit value={facts.me.killParticipation} habit={habits?.killParticipation}>
          {formatPercent(facts.me.killParticipation)}
        </VersusHabit>
      ),
      note: habits ? copy.facts.habit(formatPercent(habits.killParticipation)) : undefined,
    },
    {
      label: copy.facts.visionPerMinute,
      value: (
        <VersusHabit value={facts.me.visionPerMinute} habit={habits?.visionPerMinute}>
          {formatDecimal(facts.me.visionPerMinute)}
        </VersusHabit>
      ),
      note: habits ? copy.facts.habit(formatDecimal(habits.visionPerMinute)) : undefined,
    },
  ];

  return (
    <section aria-label={copy.facts.title}>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-control border border-line bg-line sm:grid-cols-3">
        {cells.map((cell, index) => (
          <div
            key={cell.label}
            className={cn(
              "flex flex-col gap-0.5 bg-raised px-3 py-2.5",
              index === cells.length - 1 && lastCellSpan(cells.length),
            )}
          >
            <dt className="text-xs text-ink-faint">{cell.label}</dt>
            <dd className="font-semibold text-ink tabular">{cell.value}</dd>
            {cell.note ? <dd className="text-xs text-ink-muted">{cell.note}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

/** La dernière case s'étire sur la fin de sa ligne : pas de trou dans la grille (2 puis 3 colonnes). */
function lastCellSpan(count: number): string {
  const mobile = count % 2 === 1 ? "col-span-2" : "col-span-1";
  const wide =
    count % 3 === 2 ? "sm:col-span-2" : count % 3 === 1 ? "sm:col-span-3" : "sm:col-span-1";
  return `${mobile} ${wide}`;
}

/** Un écart avec le vis-à-vis : vert en avance, rouge en retard, neutre tant qu'il reste faible. */
function Signed({ value, even, children }: { value: number; even: number; children: ReactNode }) {
  return (
    <span className={cn(value >= even ? "text-win" : value <= -even ? "text-loss" : "text-ink")}>
      {children}
    </span>
  );
}

/** Une mesure comparée aux habitudes : colorée seulement à 10 % d'écart ou plus. */
function VersusHabit({
  value,
  habit,
  children,
}: {
  value: number;
  habit: number | undefined;
  children: ReactNode;
}) {
  const ratio = habit && habit > 0 ? value / habit : 1;
  return (
    <span
      className={cn(
        ratio >= 1 + HABIT_GAP ? "text-win" : ratio <= 1 - HABIT_GAP ? "text-loss" : "text-ink",
      )}
    >
      {children}
    </span>
  );
}
