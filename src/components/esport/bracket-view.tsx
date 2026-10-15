import { t } from "@/i18n/fr";
import type { BracketSection } from "@/lib/esport/bracket";

import { MatchCard } from "./match-card";

const copy = t.esport.bracket;

/** Nom d'une colonne d'arbre à élimination directe, compté depuis la finale. */
function singleRoundLabel(index: number, count: number): string {
  const fromEnd = count - 1 - index;
  if (fromEnd === 0) return copy.finals;
  if (fromEnd === 1) return copy.semifinals;
  if (fromEnd === 2) return copy.quarterfinals;
  return copy.round(index + 1);
}

/**
 * L'arbre d'une étape : une rangée par tableau (gagnants, perdants, grande
 * finale), une colonne par tour. Les colonnes se centrent verticalement, ce
 * qui place chaque match entre les deux qui l'alimentent. Sur petit écran,
 * l'arbre défile sur le côté dans son cadre, sans faire déborder la page.
 */
export function BracketView({ sections }: { sections: BracketSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-faint md:hidden">{copy.scroll}</p>
      {sections.map((section) => (
        <section key={section.kind} aria-label={copy[section.kind]} className="flex flex-col gap-3">
          {section.kind !== "single" ? (
            <h3 className="display text-xl text-ink">{copy[section.kind]}</h3>
          ) : null}
          <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            <ol className="flex w-max items-stretch gap-6">
              {section.columns.map((column, index) => (
                <li key={index} className="flex flex-col gap-3">
                  {section.kind !== "final" ? (
                    <p className="text-xs font-semibold text-ink-faint">
                      {section.kind === "single"
                        ? singleRoundLabel(index, section.columns.length)
                        : copy.round(index + 1)}
                    </p>
                  ) : null}
                  <ul className="flex flex-1 flex-col justify-around gap-4">
                    {column.map((match) => (
                      <li key={match.id}>
                        <MatchCard match={match} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ))}
    </div>
  );
}
