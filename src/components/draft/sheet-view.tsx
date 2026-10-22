import { Slash } from "@/components/brand/slash";
import { ChampionIcon } from "@/components/champion/champion-icon";
import { Block, Growing, Lines } from "@/components/coach/writing";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { SheetFacts, SheetView as Sheet, Verdict } from "@/lib/draft/sheet-view";
import { formatInteger, formatPercent } from "@/lib/format";

import { TeamMark, ThreatMark } from "./team-mark";

const copy = t.draft.sheet;

const VERDICT_TONE: Record<Verdict, string> = {
  favorable: "border-win/40 text-win",
  even: "border-line-strong text-ink-muted",
  unfavorable: "border-loss/40 text-loss",
};

/**
 * La fiche du coach : conditions de victoire, puis le matchup en voie et ses
 * options. Pendant l'écriture, chaque texte grandit à sa place et ce qui n'est
 * pas encore écrit garde une ligne d'attente, pour que rien ne saute.
 */
export function SheetView({
  sheet,
  opponent,
  writing = false,
}: {
  sheet: Sheet;
  opponent: { name: string; iconUrl: string | null } | null;
  /** Vrai pendant l'écriture : les parties manquantes s'affichent en attente. */
  writing?: boolean;
}) {
  const win = sheet.winConditions;
  const matchup = sheet.matchup;
  const options = matchup?.options ?? [];

  return (
    <article className="flex flex-col gap-6" aria-busy={writing}>
      <section aria-labelledby="sheet-win" className="flex flex-col gap-3">
        <h3 id="sheet-win" className="display text-xl text-ink">
          {copy.win.title}
        </h3>
        <dl className="flex flex-col gap-3">
          <WinLine side="ours" label={copy.win.ours} text={win?.ours} writing={writing} />
          <WinLine side="theirs" label={copy.win.theirs} text={win?.theirs} writing={writing} />
        </dl>
      </section>

      <section aria-labelledby="sheet-matchup" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {opponent ? (
            <ChampionIcon name={opponent.name} src={opponent.iconUrl} className="size-10" />
          ) : null}
          <div className="flex min-w-0 flex-col items-start gap-1">
            <h3 id="sheet-matchup" className="display text-xl text-ink">
              {copy.matchup.title(opponent?.name ?? "?")}
            </h3>
            {matchup?.verdict ? (
              <span
                className={cn(
                  "rounded-pill border px-2 text-xs leading-5 font-semibold",
                  VERDICT_TONE[matchup.verdict],
                )}
              >
                {copy.matchup.verdict[matchup.verdict]}
              </span>
            ) : writing ? (
              <Skeleton className="h-5 w-20 rounded-pill" />
            ) : null}
          </div>
        </div>

        {sheet.facts ? <DuelStat facts={sheet.facts} /> : null}

        <Growing text={matchup?.summary} writing={writing} className="text-ink" lines={2} />

        <Block label={copy.matchup.keyMoments}>
          <Growing
            text={matchup?.keyMoments}
            writing={writing}
            className="text-ink-muted"
            lines={2}
          />
        </Block>

        <Block label={copy.matchup.options}>
          {options.length > 0 ? (
            <ol className="flex flex-col gap-3">
              {options.map((option, index) => (
                <li key={index} className="flex gap-2.5">
                  <Slash className="mt-[0.3em] h-[0.85em] text-accent" />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      <span className="sr-only">{copy.matchup.option(index + 1)}</span>
                      {option.title ?? ""}
                    </p>
                    <Growing
                      text={option.detail}
                      writing={writing}
                      className="text-ink-muted"
                      lines={1}
                    />
                  </div>
                </li>
              ))}
            </ol>
          ) : writing ? (
            <Lines count={3} />
          ) : null}
        </Block>

        <div className="flex gap-2.5 rounded-control border border-warn/30 bg-warn-soft px-3 py-2.5">
          <ThreatMark className="mt-1" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-warn">{copy.matchup.watchOut}</p>
            <Growing text={matchup?.watchOut} writing={writing} className="text-ink" lines={1} />
          </div>
        </div>
      </section>

      {sheet.facts ? <Sources facts={sheet.facts} /> : null}
    </article>
  );
}

/** Le résultat réel du duel dans nos parties analysées, avec sa taille d'échantillon. */
function DuelStat({ facts }: { facts: SheetFacts }) {
  const stats = facts.stats;
  if (!stats) return null;
  const duel = stats.matchup;
  if (!duel || duel.games === 0) {
    return <p className="text-sm text-ink-faint">{copy.matchup.statNone}</p>;
  }
  if (!stats.reliable) {
    return (
      <p className="text-sm text-ink-faint">{copy.matchup.statThin(formatInteger(duel.games))}</p>
    );
  }
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="font-semibold text-ink tabular">
        {copy.matchup.stat(formatPercent(duel.wins / duel.games), formatInteger(duel.games))}
      </span>
      <span className="text-ink-faint">
        {copy.matchup.statsLevel} · {copy.patch(stats.patch)}
      </span>
    </p>
  );
}

/** D'où viennent les chiffres de la fiche. */
function Sources({ facts }: { facts: SheetFacts }) {
  return (
    <footer className="flex flex-col gap-1 border-t border-line pt-3 text-xs text-ink-faint">
      <p className="font-semibold text-ink-muted">{copy.sources.title}</p>
      <p>
        {facts.stats
          ? copy.sources.stats(formatInteger(facts.stats.matches), facts.stats.patch)
          : copy.sources.noStats}
      </p>
      <p>{copy.sources.ddragon(facts.ddragonVersion)}</p>
      <p>{copy.sources.coach}</p>
    </footer>
  );
}

function WinLine({
  side,
  label,
  text,
  writing,
}: {
  side: "ours" | "theirs";
  label: string;
  text: string | undefined;
  writing: boolean;
}) {
  return (
    <div className="flex gap-2.5">
      <TeamMark side={side} className="mt-1.5" />
      <div className="min-w-0 flex-1">
        <dt className="text-sm font-semibold text-ink">{label}</dt>
        <dd>
          <Growing text={text} writing={writing} className="text-ink-muted" lines={2} />
        </dd>
      </div>
    </div>
  );
}
