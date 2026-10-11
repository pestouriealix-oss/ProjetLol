import { RoleGlyph } from "@/components/map/role-glyph";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

import { TeamMark } from "./team-mark";

const copy = t.draft;

/**
 * Le tableau de la sélection des champions : les deux équipes face à face,
 * une ligne par rôle, comme les joueurs ont l'habitude de la lire. Les cases se
 * rempliront à partir de la capture ; pour l'instant seule la place du joueur
 * est marquée.
 */
export function DraftBoard({ me }: { me?: Role }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4">
      <Team side="ours" title={copy.allies} me={me} />
      <Team side="theirs" title={copy.enemies} />
    </div>
  );
}

function Team({ side, title, me }: { side: "ours" | "theirs"; title: string; me?: Role }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 pb-2.5 display text-lg tracking-[0.04em] text-ink">
        <TeamMark side={side} />
        {title}
      </h3>
      <ul className="flex flex-col gap-1.5">
        {ROLES.map((role) => {
          const mine = role === me;
          return (
            <li
              key={role}
              className={cn(
                "flex h-13 items-center gap-2 rounded-control border px-2.5 sm:gap-3 sm:px-3",
                mine ? "border-accent/60 bg-accent-soft" : "border-dashed border-line-strong/60",
              )}
            >
              <RoleGlyph
                role={role}
                active={mine}
                className={cn("size-5", mine ? "text-accent" : "text-ink-faint")}
              />
              <span className={cn("text-sm font-semibold", mine ? "text-ink" : "text-ink-muted")}>
                {t.roles[role]}
              </span>
              {mine ? (
                <Badge tone="accent" className="ml-auto">
                  {copy.you}
                </Badge>
              ) : (
                <span className="ml-auto text-xs text-ink-faint max-sm:hidden">{copy.slot}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
