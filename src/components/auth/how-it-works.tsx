import type { CSSProperties, ReactNode } from "react";

import { TeamMark } from "@/components/draft/team-mark";
import { RoleGlyph } from "@/components/map/role-glyph";
import { t } from "@/i18n/fr";
import { ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

const copy = t.auth.howItWorks;

const delay = (ms: number) => ({ "--intro-delay": `${ms}ms` }) as CSSProperties;

/** Écart entre l'arrivée de deux étapes, en millisecondes. */
const STEP_GAP = 140;

/**
 * Le parcours en trois temps, à côté des formulaires de connexion : avant la
 * partie, pendant le chargement, après. Chaque étape a un petit schéma de
 * l'écran correspondant, volontairement générique : aucun champion, aucun
 * pseudo, aucun chiffre qui ressemblerait à de vraies données.
 */
export function HowItWorks() {
  const illustrations: ReactNode[] = [
    <DraftSketch key="draft" />,
    <SheetSketch key="sheet" />,
    <ProgressSketch key="progress" />,
  ];

  return (
    <section
      aria-labelledby="how-it-works-title"
      className="w-full max-w-xl rounded-sheet border border-line bg-surface p-6 sm:p-8"
    >
      <h2 id="how-it-works-title" className="display text-sm tracking-[0.08em] text-ink-faint">
        {copy.title}
      </h2>
      <ol className="mt-6 flex flex-col">
        {copy.steps.map((step, index) => (
          <li
            key={step.title}
            className="grid intro-rise grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[3rem_minmax(0,1fr)]"
            style={delay(index * STEP_GAP)}
          >
            {/* Le numéro, et le fil qui relie les étapes entre elles. */}
            <div className="flex flex-col items-center">
              <span className="display text-3xl leading-none text-ink-faint tabular">
                {String(index + 1).padStart(2, "0")}
              </span>
              {index < copy.steps.length - 1 ? (
                <span aria-hidden className="mt-3 w-px flex-1 bg-line-strong" />
              ) : null}
            </div>
            <div className={cn("min-w-0", index < copy.steps.length - 1 && "pb-8")}>
              <p className="text-xs font-semibold tracking-[0.06em] text-ink-faint uppercase">
                {step.when}
              </p>
              <h3 className="mt-1 display text-2xl text-ink">{step.title}</h3>
              <p className="mt-1.5 max-w-[46ch] text-ink-muted">{step.body}</p>
              <div aria-hidden className="mt-4">
                {illustrations[index]}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Le rôle du joueur sur le schéma de la draft. */
const SKETCH_ROLE: Role = "JUNGLE";

/** La sélection des champions : deux colonnes face à face, la place du joueur marquée. */
function DraftSketch() {
  return (
    <div className="grid max-w-sm grid-cols-2 gap-2.5">
      {(["ours", "theirs"] as const).map((side) => (
        <div key={side} className="flex flex-col gap-1">
          <TeamMark side={side} className="mb-1 ml-1" />
          {ROLES.map((role) => {
            const mine = side === "ours" && role === SKETCH_ROLE;
            return (
              <div
                key={role}
                className={cn(
                  "flex h-6 items-center gap-2 rounded-[calc(var(--radius-control)-2px)] border px-2",
                  mine ? "border-accent/60 bg-accent-soft" : "border-dashed border-line-strong/70",
                )}
              >
                <RoleGlyph
                  role={role}
                  active={mine}
                  className={cn("size-3.5", mine ? "text-accent" : "text-ink-faint")}
                />
                {mine ? (
                  <span className="text-xs font-semibold text-accent">{copy.you}</span>
                ) : (
                  <span className="h-1.5 w-10 rounded-pill bg-line-strong/70" />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** La fiche : quelques lignes, et les options proposées par le coach. */
function SheetSketch() {
  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-panel border border-line bg-raised p-3.5">
      <div className="flex items-center gap-2">
        <TeamMark side="ours" />
        <span className="h-2 w-3/5 rounded-pill bg-line-strong" />
      </div>
      <div className="flex items-center gap-2">
        <TeamMark side="theirs" />
        <span className="h-2 w-2/5 rounded-pill bg-line-strong/70" />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1">
        {copy.options.map((option, index) => (
          <span
            key={option}
            className={cn(
              "inline-flex h-7 items-center rounded-pill border px-3 text-xs font-semibold",
              index === 0
                ? "border-accent bg-accent-soft text-accent"
                : "border-line-strong text-ink-muted",
            )}
          >
            {option}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Les parties qui s'enchaînent : une barre par partie, haute pour une victoire,
 * basse pour une défaite. La forme porte le sens, pas la couleur seule.
 */
const PROGRESS = [0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1] as const;

function ProgressSketch() {
  return (
    <div className="flex h-9 max-w-sm items-end gap-1">
      {PROGRESS.map((win, index) => (
        <span
          key={index}
          className={cn("flex-1 rounded-[2px]", win ? "h-full bg-win/50" : "h-1/3 bg-loss/45")}
        />
      ))}
    </div>
  );
}
