import { cn } from "@/lib/cn";

/**
 * Indicateur d'attente : un signal qui pulse, comme un ping sur la carte.
 * Purement visuel ; l'état d'attente est annoncé par le composant qui l'affiche.
 */
export function Ping({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-flex size-4 shrink-0 items-center justify-center", className)}
    >
      <span className="absolute inset-0 animate-ripple rounded-pill border-[1.5px] border-current" />
      <span className="absolute inset-0 animate-ripple rounded-pill border-[1.5px] border-current [animation-delay:-750ms]" />
      <span className="size-1.5 rounded-pill bg-current" />
    </span>
  );
}
