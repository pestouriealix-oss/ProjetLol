import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import type { SwissGroup } from "@/lib/esport/swiss";

import { TeamLogo } from "./team-logo";

const copy = t.esport.swiss;

/**
 * La phase suisse, regroupée par bilan : les qualifiées, puis chaque bilan en
 * cours (2–0, 1–1…), puis les éliminées. Le bilan est écrit en toutes lettres
 * dans chaque en-tête : la couleur ne fait que le souligner.
 */
export function SwissBoard({ groups }: { groups: SwissGroup[] }) {
  return (
    <section aria-labelledby="swiss-title" className="flex flex-col gap-3">
      <div>
        <h3 id="swiss-title" className="display text-xl text-ink">
          {copy.title}
        </h3>
        <p className="text-sm text-ink-muted">{copy.body}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group) => (
          <li
            key={`${group.kind}-${group.wins}-${group.losses}`}
            className={cn(
              "rounded-panel border bg-surface p-3.5",
              group.kind === "qualified" ? "border-win/45" : "border-line",
              group.kind === "eliminated" && "opacity-70",
            )}
          >
            <p className="flex items-baseline justify-between gap-3">
              <span
                className={cn(
                  "font-semibold",
                  group.kind === "qualified"
                    ? "text-win"
                    : group.kind === "eliminated"
                      ? "text-loss"
                      : "text-ink-muted",
                )}
              >
                {group.kind === "qualified"
                  ? copy.qualified
                  : group.kind === "eliminated"
                    ? copy.eliminated
                    : null}
              </span>
              <span className="display text-2xl text-ink tabular">
                {copy.record(group.wins, group.losses)}
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {group.standings.map((standing) => (
                <li
                  key={standing.team.id}
                  title={standing.team.name}
                  className="flex h-8 items-center gap-1.5 rounded-control bg-field pr-2.5 pl-1.5 text-sm font-semibold text-ink"
                >
                  <TeamLogo src={standing.team.image_url} className="size-5" />
                  {standing.team.acronym ?? standing.team.name}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
