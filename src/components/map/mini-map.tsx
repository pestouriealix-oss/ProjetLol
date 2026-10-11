import type { CSSProperties } from "react";

import { ROLES, type Role } from "@/lib/config";
import { cn } from "@/lib/cn";

import {
  ALLY_POSITIONS,
  BASES,
  CAMPS,
  ENEMY_POSITIONS,
  LANES,
  MAP_SIZE,
  PITS,
  RIVER,
  type MapPoint,
  type MapRoute,
} from "./geometry";

type MiniMapProps = {
  /** Description lue par les lecteurs d'écran. Sans elle, la carte est décorative. */
  label?: string;
  /** Affiche les dix joueurs à leur poste. */
  showTeams?: boolean;
  /** Rôle du joueur : son pion est en corail et les trajets partent de lui. */
  me?: Role;
  /** Rôle adverse à surveiller, entouré d'un repère ambre. */
  threat?: Role;
  routes?: readonly MapRoute[];
  /** Trajet affiché parmi `routes`. */
  activeRouteId?: string;
  /** Signal isolé (sans trajet), par exemple « commence ici ». */
  ping?: MapPoint;
  /** Délai avant l'entrée en scène des pions et du trajet, en millisecondes. */
  introDelay?: number;
  /**
   * L'entrée en scène est terminée : un trajet qui devient actif répond à un
   * geste, son signal d'arrivée se cale sur la durée du tracé et non plus sur
   * le délai d'entrée.
   */
  introDone?: boolean;
  className?: string;
};

const delay = (ms: number) => ({ "--intro-delay": `${Math.round(ms)}ms` }) as CSSProperties;

/** Demi-diagonale du losange adverse. */
const ENEMY_SIZE = 3.1;

/**
 * Carte tactique : le tableau sur lequel le coach montre où jouer.
 *
 * Alliés et adversaires se distinguent par leur forme, pas seulement par leur
 * couleur : ronds pleins pour les alliés, losanges creux pour les adversaires.
 * Les trajets se dessinent et se rétractent par des transitions CSS ; la
 * première apparition est une animation qui laisse ensuite la main.
 */
export function MiniMap({
  label,
  showTeams = false,
  me,
  threat,
  routes = [],
  activeRouteId,
  ping,
  introDelay = 0,
  introDone = false,
  className,
}: MiniMapProps) {
  const myPosition = me ? ALLY_POSITIONS[me] : undefined;
  const threatPosition = threat ? ENEMY_POSITIONS[threat] : undefined;
  const routeDelay = introDelay + 520;
  // Le signal part quand le trait arrive : après l'entrée en scène, ou après
  // le temps de rétractation de l'ancien trajet puis de tracé du nouveau.
  const arrivalDelay: CSSProperties = introDone
    ? ({
        "--intro-delay": "calc(var(--duration-base) + var(--duration-draw) - 80ms)",
      } as CSSProperties)
    : delay(routeDelay + 700);

  return (
    <svg
      viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("aspect-square w-full rounded-panel bg-field", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/* Le terrain */}
      <path d={RIVER} className="stroke-river/50" strokeWidth="5.2" />
      {Object.values(LANES).map((lane) => (
        <path key={lane} d={lane} className="stroke-line-strong/70" strokeWidth="1.1" />
      ))}
      {PITS.map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r="3.2"
          strokeWidth="0.9"
          className="fill-field stroke-ink-faint/60"
        />
      ))}
      {CAMPS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" className="fill-line-strong/80" />
      ))}
      <rect
        x={BASES.ours[0] - 3.5}
        y={BASES.ours[1] - 3.5}
        width="7"
        height="7"
        rx="1.6"
        className="fill-ink-muted"
      />
      <rect
        x={BASES.theirs[0] - 3.5}
        y={BASES.theirs[1] - 3.5}
        width="7"
        height="7"
        rx="1.6"
        className="fill-field stroke-ink-faint"
        strokeWidth="1.2"
      />

      {/* Les joueurs */}
      {showTeams
        ? ROLES.map((role, index) => {
            const [x, y] = ENEMY_POSITIONS[role];
            return (
              <polygon
                key={`enemy-${role}`}
                points={`${x},${y - ENEMY_SIZE} ${x + ENEMY_SIZE},${y} ${x},${y + ENEMY_SIZE} ${x - ENEMY_SIZE},${y}`}
                className="intro-pop fill-field stroke-ink-muted"
                strokeWidth="1.3"
                style={delay(introDelay + 180 + index * 55)}
              />
            );
          })
        : null}
      {threatPosition ? (
        <circle
          cx={threatPosition[0]}
          cy={threatPosition[1]}
          r="5.6"
          className="intro-pop stroke-warn"
          strokeWidth="1.1"
          strokeDasharray="2.2 2.4"
          style={delay(introDelay + 480)}
        />
      ) : null}
      {showTeams
        ? ROLES.filter((role) => role !== me).map((role, index) => {
            const [x, y] = ALLY_POSITIONS[role];
            return (
              <circle
                key={`ally-${role}`}
                cx={x}
                cy={y}
                r="2.7"
                className="intro-pop fill-ink"
                style={delay(introDelay + index * 55)}
              />
            );
          })
        : null}

      {/* Les trajets du coach */}
      {routes.map((route) => {
        const active = route.id === activeRouteId;
        return (
          <g key={route.id} data-active={active} className="group/route">
            <path
              d={route.d}
              pathLength={1}
              strokeWidth="1.9"
              style={delay(routeDelay)}
              className={cn(
                // Tiret de 1 puis vide de 2, retrait un peu au-delà de 1 : sinon le
                // bout rond d'un tiret voisin laisse un point au bout du tracé.
                "intro-draw stroke-accent [stroke-dasharray:1_2]",
                // Le trait actif se dessine après que l'ancien s'est rétracté.
                "transition-[stroke-dashoffset] ease-(--ease-in-out)",
                active
                  ? "delay-(--duration-base) duration-(--duration-draw) [stroke-dashoffset:0]"
                  : "duration-(--duration-base) [stroke-dashoffset:1.02]",
              )}
            />
            {/* Signal à l'arrivée : rejoué à chaque fois que le trajet devient actif. */}
            {active ? (
              <circle
                cx={route.target[0]}
                cy={route.target[1]}
                r="8"
                className="ping-wave stroke-accent"
                strokeWidth="1.2"
                style={arrivalDelay}
              />
            ) : null}
            {/* Le pion du joueur : un tiret de longueur nulle, donc un point,
                qui glisse le long du tracé en même temps que le trait. Il se
                pose avec les autres pions, puis part quand le trait démarre. */}
            <g className="intro-fade" style={delay(introDelay + 300)}>
              {[
                { width: 7.4, color: "stroke-field" },
                { width: 5, color: "stroke-accent" },
              ].map((dot) => (
                <path
                  key={dot.width}
                  d={route.d}
                  pathLength={1}
                  strokeWidth={dot.width}
                  strokeDasharray="0.001 3"
                  style={delay(routeDelay)}
                  className={cn(
                    "intro-travel",
                    dot.color,
                    "transition-[stroke-dashoffset,opacity] ease-(--ease-in-out)",
                    active
                      ? "opacity-100 delay-(--duration-base) duration-(--duration-draw) [stroke-dashoffset:-0.999]"
                      : "opacity-0 duration-(--duration-base) [stroke-dashoffset:0]",
                  )}
                />
              ))}
            </g>
          </g>
        );
      })}

      {/* Point de départ du joueur */}
      {myPosition ? (
        <circle
          cx={myPosition[0]}
          cy={myPosition[1]}
          r={routes.length > 0 ? 4.4 : 3}
          strokeWidth="1.3"
          style={delay(introDelay + 300)}
          className={cn(
            "intro-pop stroke-accent",
            routes.length > 0 ? "fill-none [stroke-dasharray:1.6_2]" : "fill-accent",
          )}
        />
      ) : null}

      {ping ? (
        <g>
          <circle
            cx={ping[0]}
            cy={ping[1]}
            r="9"
            className="ping-wave stroke-accent"
            strokeWidth="1.2"
            style={delay(introDelay + 300)}
          />
          <circle cx={ping[0]} cy={ping[1]} r="2.6" className="fill-accent" />
        </g>
      ) : null}
    </svg>
  );
}
