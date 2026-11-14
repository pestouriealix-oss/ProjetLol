import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
/** La bande d'un volet : deux tours, pour que chaque chiffre fasse un tour complet avant de se poser. */
const STRIP = [...DIGITS, ...DIGITS];

/** Écart entre deux volets qui se mettent à tourner, de gauche à droite. */
const STAGGER_MS = 70;

/**
 * Une valeur courte (« +342 ») affichée sur des volets, comme un panneau
 * d'aéroport : à l'arrivée, chaque chiffre défile volet par volet jusqu'au bon,
 * de gauche à droite. Le reste (signe, espace) est posé tel quel.
 *
 * Tout est en CSS (`flap-roll`) : rien à hydrater, et le mouvement réduit
 * pose directement les chiffres. Les lecteurs d'écran lisent `label`.
 */
export function FlapValue({
  value,
  label,
  className,
  delayMs = 0,
}: {
  value: string;
  /** Ce que lit un lecteur d'écran : « +342 LP depuis le 15 oct. ». */
  label: string;
  className?: string;
  /** Attente avant le premier volet, pour passer après l'arrivée de la carte. */
  delayMs?: number;
}) {
  const characters = [...value];
  return (
    <span role="img" aria-label={label} className={cn("inline-flex gap-[0.08em]", className)}>
      {characters.map((character, index) => {
        const found = DIGITS.indexOf(character);
        // Position visée sur la bande, après un tour complet : un 0 tourne aussi.
        const digit = found < 0 ? -1 : DIGITS.length + found;
        const style = { "--intro-delay": `${delayMs + index * STAGGER_MS}ms` } as CSSProperties;
        return (
          <span
            key={index}
            aria-hidden
            className="relative inline-flex h-[1.2em] w-[0.72em] justify-center overflow-hidden rounded-[0.12em] bg-field leading-[1.2em] tabular shadow-[inset_0_0_0_1px_var(--color-line)]"
          >
            {digit < 0 ? (
              <span>{character}</span>
            ) : (
              <span
                className="flex flap-roll flex-col"
                style={
                  {
                    ...style,
                    translate: `0 ${-digit * 1.2}em`,
                    "--flap-steps": digit,
                  } as CSSProperties
                }
              >
                {STRIP.map((shown, position) => (
                  <span key={position}>{shown}</span>
                ))}
              </span>
            )}
            {/* La charnière du volet. */}
            <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-canvas/80" />
          </span>
        );
      })}
    </span>
  );
}
