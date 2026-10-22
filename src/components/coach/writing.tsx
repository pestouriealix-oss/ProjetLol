import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

/**
 * Ce que la fiche de draft et le bilan de partie ont en commun pendant que le
 * coach écrit : chaque texte grandit à sa place, et ce qui n'est pas encore
 * écrit garde une ligne d'attente, pour que rien ne saute.
 */

/** Un texte qui s'écrit : affiché tel quel, ou des lignes d'attente s'il n'a pas commencé. */
export function Growing({
  text,
  writing,
  className,
  lines,
}: {
  text: string | undefined;
  writing: boolean;
  className?: string;
  lines: number;
}) {
  if (text) return <p className={cn("text-pretty", className)}>{text}</p>;
  return writing ? <Lines count={lines} /> : null;
}

export function Lines({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 py-1">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3.5 rounded-pill", index === count - 1 ? "w-3/5" : "w-full")}
        />
      ))}
    </div>
  );
}

/** Un bloc titré de la fiche ou du bilan. */
export function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-semibold tracking-[0.04em] text-ink-faint uppercase">{label}</p>
      {children}
    </div>
  );
}

