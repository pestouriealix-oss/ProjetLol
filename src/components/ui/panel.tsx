import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Surface posée sur le terrain : une bordure fine, pas d'ombre. */
export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("rounded-panel border border-line bg-surface", className)} {...props} />
  );
}

/** En-tête d'une section de page : titre en capitales, précision, et un aparté à droite. */
export function SectionHeading({
  id,
  title,
  description,
  aside,
}: {
  id?: string;
  title: string;
  description?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="max-w-[60ch]">
        <h2 id={id} className="display text-2xl text-ink">
          {title}
        </h2>
        {description ? <p className="mt-2 text-ink-muted">{description}</p> : null}
      </div>
      {aside}
    </header>
  );
}
