import { cn } from "@/lib/cn";

/**
 * La barre oblique : le signe de la marque. Elle sert de logo, de repère de
 * navigation et de puce dans les listes du coach. Couleur héritée du texte.
 */
export function Slash({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 12 20" className={cn("h-[1em] w-auto shrink-0", className)}>
      <path d="M5.6 0H12L6.4 20H0z" fill="currentColor" />
    </svg>
  );
}
