import type { Role } from "@/lib/config";
import { cn } from "@/lib/cn";

/**
 * Pictogrammes des rôles, tirés de la carte : chaque rôle est la voie qu'il
 * occupe, dessinée dans un petit carré. Créés pour ce projet (les icônes de
 * position du jeu appartiennent à Riot).
 *
 * Quand `active` passe à vrai, la voie se redessine d'un trait dans la couleur
 * courante : c'est le geste du coach qui entoure un rôle sur son tableau.
 */

const LANE_PATHS: Record<Role, string> = {
  TOP: "M3 13 V5 Q3 3 5 3 H13",
  JUNGLE: "M4.4 10.6 C5.2 7 7.4 9.4 8 8 S10.8 9 11.6 5.4",
  MID: "M3.6 12.4 L12.4 3.6",
  ADC: "M3 13 H11 Q13 13 13 11 V3",
  SUPPORT: "M3 13 H11 Q13 13 13 11 V3",
};

type RoleGlyphProps = {
  role: Role;
  /** Voie tracée en couleur. Sinon elle reste visible, en retrait. */
  active?: boolean;
  className?: string;
};

export function RoleGlyph({ role, active = true, className }: RoleGlyphProps) {
  const lane = LANE_PATHS[role];
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", className)}
    >
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeOpacity="0.28" />
      <path d={lane} stroke="currentColor" strokeOpacity="0.55" strokeWidth="1.5" />
      <path
        d={lane}
        pathLength={1}
        stroke="currentColor"
        strokeWidth="1.75"
        className={cn(
          // Tiret de 1, vide de 2, retrait un peu au-delà de 1 : sinon le bout
          // rond d'un tiret voisin laisse un point au bout de la voie effacée.
          "transition-[stroke-dashoffset] duration-(--duration-slow) ease-(--ease-out) [stroke-dasharray:1_2]",
          active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1.02]",
        )}
      />
      {/* Le support accompagne : un second joueur dans le coin de la voie du bas. */}
      {role === "SUPPORT" ? (
        <circle
          cx="9.4"
          cy="9.4"
          r="1.25"
          fill="currentColor"
          className={cn(
            "origin-center transition-[opacity,scale] duration-(--duration-slow) ease-(--ease-spring-bouncy) [transform-box:fill-box]",
            active ? "scale-100 opacity-100" : "scale-75 opacity-55",
          )}
        />
      ) : null}
    </svg>
  );
}
