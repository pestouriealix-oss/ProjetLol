import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Écran vide : dit ce qui manque et, si possible, comment y remédier.
 * L'illustration (la carte tactique) n'apparaît que s'il y a la place.
 */
export function EmptyState({
  title,
  body,
  action,
  illustration,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  illustration?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-center gap-x-10 gap-y-8 px-6 py-10 sm:px-8",
        illustration && "md:grid-cols-[minmax(0,1fr)_14rem]",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-3">
        <h2 className="display text-3xl text-ink">{title}</h2>
        <p className="max-w-[52ch] text-lg text-ink-muted">{body}</p>
        {action ? <div className="pt-3">{action}</div> : null}
      </div>
      {illustration ? <div className="max-md:hidden">{illustration}</div> : null}
    </div>
  );
}
