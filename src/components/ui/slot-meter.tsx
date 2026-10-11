import { cn } from "@/lib/cn";

type SlotMeterProps = {
  used: number;
  total: number;
  /** Texte complet, par exemple « 1 sur 2 comptes ». */
  label: string;
  className?: string;
};

/**
 * Jauge d'emplacements : une barre oblique par place, pleine quand elle est
 * prise. Dit d'un coup d'œil combien il en reste.
 */
export function SlotMeter({ used, total, label, className }: SlotMeterProps) {
  return (
    <p className={cn("flex items-center gap-3 text-sm text-ink-muted", className)}>
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-4 w-1.5 -skew-x-[14deg] rounded-[1px] transition-[background-color,scale] duration-(--duration-slow) ease-(--ease-spring-bouncy)",
              index < used ? "bg-accent" : "scale-y-75 bg-line-strong/60",
            )}
          />
        ))}
      </span>
      <span className="tabular">{label}</span>
    </p>
  );
}
