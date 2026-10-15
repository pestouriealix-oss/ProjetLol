import { t } from "@/i18n/fr";
import type { Standing } from "@/lib/esport/schemas";

import { TeamLogo } from "./team-logo";

const copy = t.esport.standings;

/** Classement d'une phase de groupes ou d'une saison régulière. */
export function StandingsTable({ standings }: { standings: Standing[] }) {
  const hasRecords = standings.some((standing) => standing.wins !== undefined);
  return (
    <section aria-labelledby="standings-title" className="flex flex-col gap-3">
      <h3 id="standings-title" className="display text-xl text-ink">
        {copy.title}
      </h3>
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-ink-faint">
              <th scope="col" className="w-14 py-2 pl-4 font-semibold">
                {copy.rank}
              </th>
              <th scope="col" className="py-2 font-semibold">
                {copy.team}
              </th>
              {hasRecords ? (
                <th scope="col" className="py-2 pr-4 text-right font-semibold">
                  {copy.record}
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {[...standings]
              .sort((a, b) => a.rank - b.rank)
              .map((standing) => (
                <tr key={standing.team.id} className="border-b border-line last:border-b-0">
                  <td className="py-2.5 pl-4 text-ink-muted tabular">{standing.rank}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-2.5 font-semibold text-ink">
                      <TeamLogo src={standing.team.image_url} className="size-6" />
                      {standing.team.name}
                    </span>
                  </td>
                  {hasRecords ? (
                    <td className="py-2.5 pr-4 text-right text-ink tabular">
                      {standing.wins ?? 0}–{standing.losses ?? 0}
                    </td>
                  ) : null}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
