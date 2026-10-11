import type { ReactNode } from "react";

/** Gabarit commun des pages de l'application : titre puis contenu. */
export function PageShell({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {aside}
      </div>
      {children}
    </div>
  );
}
