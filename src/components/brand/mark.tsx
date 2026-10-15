import { cn } from "@/lib/cn";

/**
 * Le K de Kairos, dessiné sur une grille de 24 : le fût, une fente étroite,
 * puis le chevron. La fente est la fenêtre (le moment opportun, ce que veut
 * dire « kairos ») ; le bras montant, en corail, est le moment saisi.
 *
 * `compact` est la version des petites tailles (moins de 32 px) : traits plus
 * épais, fente plus large, sans la coupe fine entre les deux bras.
 *
 * Couleurs : le fût et le bras descendant suivent la couleur du texte, le bras
 * montant prend la couleur d'accent (à remplacer par `accentClassName`).
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
      viewBox={compact ? "3.5 2.5 19.1 19" : "4 3 17.14 18"}
      className={cn("h-[1em] w-auto shrink-0", className)}
    >
      {compact ? (
        <>
          <rect x="3.5" y="3" width="5.5" height="18" fill="currentColor" />
          <path d="M11.2 12 L16.6 21.5 H22.6 L17.2 12Z" fill="currentColor" />
          <path data-arm d="M11.2 12 L16.6 2.5 H22.6 L17.2 12Z" className={accentClassName} />
        </>
      ) : (
        <>
          <rect x="4" y="3" width="4.5" height="18" fill="currentColor" />
          <path d="M10.62 12.1 L16.14 21 H21.14 L15.62 12.1Z" fill="currentColor" />
          <path data-arm d="M10.25 11.5 L15.52 3 H20.52 L15.25 11.5Z" className={accentClassName} />
        </>
      )}
    </svg>
  );
}
