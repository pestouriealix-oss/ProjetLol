import { ViewTransition, type ReactNode } from "react";

import { PAGE_ENTER, PAGE_EXIT, PAGE_REVEAL, pageTransitionName } from "@/lib/view-transitions";

/**
 * Gabarit commun des pages de l'application : un en-tête (le titre, ou un
 * en-tête sur mesure), puis le contenu.
 *
 * C'est aussi la frontière de transition entre pages. En suivant un lien,
 * l'ancienne page s'efface vite et la nouvelle arrive plus posément.
 *
 * `route` identifie la page : son squelette (`loading.tsx`) et son contenu
 * donnent la même valeur, ce qui permet de fondre l'un dans l'autre sur place
 * quand les données arrivent, au lieu de rejouer une arrivée de page.
 */
export function PageShell({
  route,
  title,
  header,
  aside,
  children,
}: {
  route: string;
  title: string;
  /** Remplace l'en-tête par défaut (le profil du tableau de bord, par exemple). */
  header?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={pageTransitionName(route)}
      share={PAGE_REVEAL}
      enter={PAGE_ENTER}
      exit={PAGE_EXIT}
      default="none"
    >
      <div className="flex flex-col gap-8">
        {header ?? (
          <header className="flex flex-wrap items-end justify-between gap-4">
            <h1 className="display text-3xl text-ink sm:text-4xl">{title}</h1>
            {aside}
          </header>
        )}
        {children}
      </div>
    </ViewTransition>
  );
}
