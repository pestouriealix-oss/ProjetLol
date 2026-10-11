import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Fait de la place en douceur pour un contenu qui apparaît (message d'erreur,
 * précision…) au lieu de pousser brutalement ce qui suit. CSS pur : la hauteur
 * part de zéro au montage grâce à `@starting-style`.
 */
export function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-(--duration-base) ease-(--ease-out)",
        "starting:grid-rows-[0fr] starting:opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
