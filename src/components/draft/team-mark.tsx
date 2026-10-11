import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type MarkProps = { className?: string; style?: CSSProperties };

/**
 * Repère d'équipe, identique partout (carte, courbe, texte) : rond plein pour
 * nous, losange creux pour eux. La forme porte le sens, pas la couleur seule.
 */
export function TeamMark({ side, className, style }: MarkProps & { side: "ours" | "theirs" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className={cn("size-2.5 shrink-0", className)}
      style={style}
    >
      {side === "ours" ? (
        <circle cx="5" cy="5" r="4" className="fill-ink" />
      ) : (
        <polygon
          points="5,0.9 9.1,5 5,9.1 0.9,5"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className="fill-none stroke-ink-muted"
        />
      )}
    </svg>
  );
}

/** Repère de menace : le même cercle pointillé ambre que sur la carte. */
export function ThreatMark({ className, style }: MarkProps) {
  return (
    <svg aria-hidden viewBox="0 0 12 12" className={cn("size-3 shrink-0", className)} style={style}>
      <circle
        cx="6"
        cy="6"
        r="4.6"
        strokeWidth="1.5"
        strokeDasharray="2.4 2.4"
        strokeLinecap="round"
        className="fill-none stroke-warn"
      />
    </svg>
  );
}
