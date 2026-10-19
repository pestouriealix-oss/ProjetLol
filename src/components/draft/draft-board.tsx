import { RoleGlyph } from "@/components/map/role-glyph";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

import { TeamMark } from "./team-mark";

const copy = t.draft;

/**
 * Le tableau de la sélection des champions, voie par voie : ton joueur à
 * gauche, son vis-à-vis à droite, le rôle au milieu. C'est la lecture qu'on fait
 * d'une draft (qui affronte qui), en cinq lignes au lieu de deux colonnes.
 * Les cases se rempliront à partir de la capture ; pour l'instant seule la
 * place du joueur est marquée.
 */
export function DraftBoard({ me }: { me?: Role }) {
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-panel border border-line bg-surface">
        <caption className="sr-only">{copy.board.caption}</caption>
        <colgroup>
          <col />
          <col className="w-20 sm:w-28" />
          <col />
        </colgroup>
        <thead>
          <tr className="text-left">
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              <span className="flex items-center gap-2 display text-lg tracking-[0.04em] text-ink">
                <TeamMark side="ours" />
                {copy.allies}
              </span>
            </th>
            <th scope="col" className="py-2.5">
              <span className="sr-only">{copy.board.role}</span>
            </th>
            <th scope="col" className="px-3 py-2.5 sm:px-4">
              <span className="flex items-center justify-end gap-2 display text-lg tracking-[0.04em] text-ink">
                {copy.enemies}
                <TeamMark side="theirs" />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {ROLES.map((role) => {
            const mine = role === me;
            return (
              <tr key={role}>
                <td
                  className={cn(
                    "border-t border-line px-3 py-2 sm:px-4",
                    mine && "bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <ChampionSlot />
                    {mine ? <Badge tone="accent">{copy.you}</Badge> : null}
                  </div>
                </td>
                <th scope="row" className="border-t border-line py-2 font-normal">
                  <span className="flex flex-col items-center gap-1">
                    <RoleGlyph
                      role={role}
                      active={mine}
                      className={cn("size-5", mine ? "text-accent" : "text-ink-faint")}
                    />
                    <span
                      className={cn("text-xs font-semibold", mine ? "text-ink" : "text-ink-muted")}
                    >
                      {t.roles[role]}
                    </span>
                  </span>
                </th>
                <td className="border-t border-line px-3 py-2 sm:px-4">
                  <div className="flex justify-end">
                    <ChampionSlot />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-sm text-ink-faint">{copy.board.hint}</p>
    </div>
  );
}

/** Emplacement d'un champion, vide tant que la capture n'est pas lue. */
function ChampionSlot() {
  return (
    <span className="block size-11 shrink-0 rounded-control border border-dashed border-line-strong/70 bg-field">
      <span className="sr-only">{copy.slot}</span>
    </span>
  );
}
