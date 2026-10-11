import { ViewTransition, type ReactNode } from "react";

import { PAGE_ENTER, PAGE_EXIT } from "@/lib/view-transitions";

/**
 * Cadre commun aux écrans de connexion et d'inscription. En passant de l'un à
 * l'autre, seul ce bloc change : il fait la transition, le reste ne bouge pas.
 */
export function AuthPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ViewTransition enter={PAGE_ENTER} exit={PAGE_EXIT} default="none">
      <div className="flex flex-col gap-6">
        <h1 className="display text-2xl text-ink">{title}</h1>
        {children}
      </div>
    </ViewTransition>
  );
}

export const authLinkClasses =
  "font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 transition-colors duration-(--duration-fast) hover:text-accent";
