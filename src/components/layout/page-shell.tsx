import { ViewTransition, type ReactNode } from "react";

import { PAGE_ENTER, PAGE_EXIT, PAGE_REVEAL, pageTransitionName } from "@/lib/view-transitions";

/**
 * Gabarit commun des pages de l'application : un grand titre, puis le contenu.
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
  aside,
  children,
}: {
  route: string;
  title: string;
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
      <div className="flex flex-col gap-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="display text-4xl text-ink sm:text-5xl">{title}</h1>
          {aside}
        </header>
        {children}
      </div>
    </ViewTransition>
  );
}
