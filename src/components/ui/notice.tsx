import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Message d'erreur de formulaire, annoncé aux lecteurs d'écran. */
export function ErrorNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-control border border-loss/40 bg-loss-soft px-3 py-2 text-sm text-ink",
        className,
      )}
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-loss" />
      <span>{children}</span>
    </p>
  );
}
