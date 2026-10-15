import type { Role } from "@/lib/config";
import { cn } from "@/lib/cn";

/**
 * Pictogrammes des rôles, créés pour ce projet (les icônes de position du jeu
 * appartiennent à Riot). Chaque rôle a une silhouette à lui, lisible à 14 px :
 * - les trois voies sont leur tracé sur la carte (coin du haut, diagonale,
 *   coin du bas) ;
 * - le jungler, qui n'a pas de voie, porte trois traces de griffes ;
 * - le support, un bouclier.
 *
 * Pas de cadre autour : un carré tracé se lirait comme une case à cocher.
 *
 * Quand `active` passe à vrai, le pictogramme se dessine d'un trait dans la
 * couleur courante : c'est le geste du coach qui entoure un rôle sur son
 * tableau. Inactif, il reste visible, en retrait.
 */

const ROLE_PATHS: Record<Role, readonly string[]> = {
  TOP: ["M3.5 12.5 V5.5 Q3.5 3.5 5.5 3.5 H12.5"],
  JUNGLE: ["M3.5 11.5 Q4.5 7 7.5 3.5", "M6.5 12.5 Q7.5 8 10.5 4.5", "M9.5 13 Q10.5 9.5 12.75 7"],
  MID: ["M3.75 12.25 L12.25 3.75"],
  ADC: ["M3.5 12.5 H10.5 Q12.5 12.5 12.5 10.5 V3.5"],
  SUPPORT: [
    "M8 2.75 L12.75 4.5 V8 C12.75 10.6 10.7 12.4 8 13.25 C5.3 12.4 3.25 10.6 3.25 8 V4.5 Z",
  ],
};

type RoleGlyphProps = {
  role: Role;
  /** Pictogramme tracé en couleur. Sinon il reste visible, en retrait. */
  active?: boolean;
  className?: string;
};

export function RoleGlyph({ role, active = true, className }: RoleGlyphProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4 shrink-0", className)}
    >
      {ROLE_PATHS[role].map((d) => (
        <g key={d}>
          <path d={d} stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
          <path
            d={d}
            pathLength={1}
            stroke="currentColor"
            strokeWidth="1.75"
            className={cn(
              // Tiret de 1, vide de 2, retrait un peu au-delà de 1 : sinon le bout
              // rond d'un tiret voisin laisse un point au bout du tracé effacé.
              "transition-[stroke-dashoffset] duration-(--duration-slow) ease-(--ease-out) [stroke-dasharray:1_2]",
              active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1.02]",
            )}
          />
        </g>
      ))}
    </svg>
  );
}
