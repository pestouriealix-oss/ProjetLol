import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Écran vide : dit ce qui manque et, si possible, comment y remédier. */
export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start gap-3 px-5 py-10 sm:px-6", className)}>
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="max-w-[58ch] text-ink-muted">{body}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
