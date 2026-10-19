import type { ReactNode } from "react";

import { Plus } from "lucide-react";

import { ChampionIcon } from "@/components/champion/champion-icon";
import { RoleGlyph } from "@/components/map/role-glyph";
import { Badge } from "@/components/ui/badge";
import { t } from "@/i18n/fr";
import { ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";
import type { Draft } from "@/lib/draft/draft";

import { TeamMark } from "./team-mark";

const copy = t.draft;

export type ChampionInfo = { name: string; iconUrl: string | null };
export type DraftSideKey = "allies" | "enemies";

/**
 * Le tableau de la sélection des champions, voie par voie : ton joueur à
 * gauche, son vis-à-vis à droite, le rôle au milieu. C'est la lecture qu'on fait
 * d'une draft (qui affronte qui), en cinq lignes au lieu de deux colonnes.
 *
 * Sans `onPick`, le tableau est en lecture seule (fiche enregistrée).
 */
export function DraftBoard({
  draft,
  champion,
  onPick,
  onSetMine,
  duplicates = [],
}: {
  draft: Draft;
  champion: (id: string) => ChampionInfo;
  onPick?: (side: DraftSideKey, role: Role) => void;
  onSetMine?: (role: Role) => void;
  /** Champions présents deux fois : leurs cases sont signalées. */
  duplicates?: readonly string[];
}) {
  return (
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
          const mine = role === draft.myRole;
          const roleName = t.roles[role];
          return (
            <tr key={role}>
              <td
                className={cn(
                  "border-t border-line px-2 py-2 sm:px-3",
                  mine && "bg-accent-soft shadow-[inset_3px_0_0_var(--color-accent)]",
                )}
              >
                <Slot
                  side="allies"
                  role={role}
                  id={draft.allies[role]}
                  champion={champion}
                  onPick={onPick}
                  duplicate={duplicates}
                  badge={mine ? <Badge tone="accent">{copy.you}</Badge> : null}
                />
              </td>
              <th scope="row" className="border-t border-line py-2 font-normal">
                {onSetMine && !mine ? (
                  <button
                    type="button"
                    onClick={() => onSetMine(role)}
                    aria-label={copy.board.setMine(roleName)}
                    title={copy.board.setMine(roleName)}
                    className="mx-auto flex flex-col items-center gap-1 rounded-control px-2 py-1 text-ink-faint transition-colors duration-(--duration-fast) hover:bg-raised hover:text-ink"
                  >
                    <RoleGlyph role={role} className="size-5" />
                    <span className="text-xs font-semibold text-ink-muted">{roleName}</span>
                  </button>
                ) : (
                  <span
                    className="flex flex-col items-center gap-1"
                    aria-label={mine ? copy.board.mine(roleName) : undefined}
                  >
                    <RoleGlyph
                      role={role}
                      active={mine}
                      className={cn("size-5", mine ? "text-accent" : "text-ink-faint")}
                    />
                    <span
                      className={cn("text-xs font-semibold", mine ? "text-ink" : "text-ink-muted")}
                    >
                      {roleName}
                    </span>
                  </span>
                )}
              </th>
              <td className="border-t border-line px-2 py-2 sm:px-3">
                <Slot
                  side="enemies"
                  role={role}
                  id={draft.enemies[role]}
                  champion={champion}
                  onPick={onPick}
                  duplicate={duplicates}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Une case : portrait et nom du champion, ou une place vide ; cliquable si le tableau est éditable. */
function Slot({
  side,
  role,
  id,
  champion,
  onPick,
  duplicate,
  badge = null,
}: {
  side: DraftSideKey;
  role: Role;
  id: string | null;
  champion: (id: string) => ChampionInfo;
  onPick?: (side: DraftSideKey, role: Role) => void;
  duplicate: readonly string[];
  badge?: ReactNode;
}) {
  const info = id ? champion(id) : null;
  const isDuplicate = id !== null && duplicate.includes(id);
  const mirrored = side === "enemies";

  const content = (
    <span className={cn("flex min-w-0 items-center gap-2.5", mirrored && "flex-row-reverse")}>
      {info ? (
        <ChampionIcon
          name={info.name}
          src={info.iconUrl}
          className={cn("size-11", isDuplicate && "ring-2 ring-loss")}
        />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-control border border-dashed border-line-strong/70 bg-field text-ink-faint">
          {onPick ? <Plus aria-hidden className="size-4" /> : null}
          <span className="sr-only">{copy.slot}</span>
        </span>
      )}
      <span className={cn("flex min-w-0 flex-col gap-1", mirrored ? "items-end" : "items-start")}>
        {info ? (
          <span className="max-w-full truncate text-sm font-semibold text-ink max-sm:hidden">
            {info.name}
          </span>
        ) : null}
        {badge}
      </span>
    </span>
  );

  if (!onPick) return content;
  const roleName = t.roles[role];
  return (
    <button
      type="button"
      onClick={() => onPick(side, role)}
      aria-label={
        info
          ? copy.board.change(info.name)
          : copy.board.choose(roleName, side === "allies" ? "ours" : "theirs")
      }
      title={isDuplicate && info ? copy.board.duplicate(info.name) : undefined}
      className={cn(
        "-m-1 flex w-[calc(100%+0.5rem)] rounded-control p-1 transition-colors duration-(--duration-fast) hover:bg-raised",
        mirrored && "justify-end",
      )}
    >
      {content}
    </button>
  );
}
