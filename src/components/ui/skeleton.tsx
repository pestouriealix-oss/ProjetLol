import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/** Bloc de chargement. Purement décoratif : masqué aux lecteurs d'écran. */
export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse-soft rounded-control bg-raised", className)}
      {...props}
    />
  );
}
