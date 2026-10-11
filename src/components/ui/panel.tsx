import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Surface de contenu : une bordure fine, pas d'ombre. */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("rounded-panel border border-line bg-surface", className)} {...props} />
  );
}

export function PanelHeader({
  title,
  description,
  aside,
  titleId,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4 sm:px-6">
      <div className="max-w-[62ch]">
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
      </div>
      {aside}
    </header>
  );
}
