import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";

import { GameIcon } from "./game-icon";

const copy = t.matchDetail.timeline;

/**
 * Ordre d'achat : les objets regroupés par passage en boutique (achats de la
 * même minute), dans l'ordre, avec l'heure de chaque passage.
 */
export function BuildOrder({
  items,
  resolve,
}: {
  items: { seconds: number; itemId: number }[];
  resolve: (itemId: number) => { name: string; iconUrl: string } | null;
}) {
  if (items.length === 0) return <p className="text-sm text-ink-muted">{copy.build.empty}</p>;
  const visits: { seconds: number; itemIds: number[] }[] = [];
  for (const item of items) {
    const last = visits.at(-1);
    if (last && Math.floor(last.seconds / 60) === Math.floor(item.seconds / 60)) {
      last.itemIds.push(item.itemId);
    } else {
      visits.push({ seconds: item.seconds, itemIds: [item.itemId] });
    }
  }
  return (
    <ol className="flex flex-wrap items-end gap-x-1 gap-y-3">
      {visits.map((visit, index) => (
        <li key={index} className="flex items-end gap-1">
          {index > 0 ? <span aria-hidden className="mb-2.5 h-px w-3 bg-line-strong" /> : null}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5">
              {visit.itemIds.map((itemId, slot) => {
                const item = resolve(itemId);
                return (
                  <GameIcon
                    key={slot}
                    src={item?.iconUrl ?? null}
                    label={item?.name ?? String(itemId)}
                    className="size-7"
                  />
                );
              })}
            </div>
            <span className="text-[0.6875rem] text-ink-faint tabular">
              <span className="sr-only">{copy.build.at(formatDuration(visit.seconds))}</span>
              <span aria-hidden>{formatDuration(visit.seconds)}</span>
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Ordre des compétences : une ligne par touche (Q, W, E, R), une colonne par
 * niveau ; la case du niveau où la touche a été montée porte ce niveau.
 */
export function SkillOrder({ skills }: { skills: number[] }) {
  if (skills.length === 0) return <p className="text-sm text-ink-muted">{copy.skills.empty}</p>;
  const levels = skills.slice(0, 18);
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-center text-xs">
        <tbody>
          {copy.skills.keys.map((key, row) => (
            <tr key={key}>
              <th scope="row" className="w-6 pr-1 text-left font-semibold text-ink-muted">
                {key}
              </th>
              {levels.map((slot, level) => {
                const taken = slot === row + 1;
                return (
                  <td
                    key={level}
                    aria-label={taken ? copy.skills.level(level + 1) : undefined}
                    className={cn(
                      "size-6 min-w-6 rounded-[4px] tabular",
                      taken ? "bg-ink font-bold text-canvas" : "bg-field text-transparent",
                    )}
                  >
                    {taken ? level + 1 : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
