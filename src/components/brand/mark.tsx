import { cn } from "@/lib/cn";

/**
 * Le G de Gufo, dessiné sur une grille de 24 : un G épais dont le creux
 * devient l'œil d'un hibou (« gufo » en italien). La pupille, en corail, est
 * le regard qui voit la partie avant les autres.
 *
 * `compact` est la version des petites tailles (moins de 32 px) : trait plus
 * épais, pupille plus grosse.
 *
 * Couleurs : le G suit la couleur du texte, la pupille prend la couleur
 * d'accent (à remplacer par `accentClassName`).
 */
export function Mark({
  compact = false,
  className,
  accentClassName = "fill-accent",
}: {
  compact?: boolean;
  className?: string;
  accentClassName?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox={compact ? "2.5 2.5 19 19" : "3 3 18 18"}
      className={cn("h-[1em] w-auto shrink-0", className)}
    >
      {compact ? (
        <>
          <path
            d="M19.8 7.5 A9 9 0 1 0 20.95 12.9 L21 10.8 H13 V14.2 H16.5 A5 5 0 1 1 16.23 9.33 Z"
            fill="currentColor"
          />
          <circle data-pupil cx="11.2" cy="12.4" r="2.5" className={accentClassName} />
        </>
      ) : (
        <>
          <path
            d="M19.6 7.6 A8.6 8.6 0 1 0 20.6 12.9 L20.6 11 H13.2 V13.8 H17.4 A5.7 5.7 0 1 1 16.9 8.9 Z"
            fill="currentColor"
          />
          <circle data-pupil cx="11.3" cy="12.4" r="2.3" className={accentClassName} />
        </>
      )}
    </svg>
  );
}
