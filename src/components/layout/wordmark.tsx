import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/cn";

/**
 * Logo typographique provisoire. Le nom vient de `APP_NAME` : le jour où il
 * change, le logo suit.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-2 font-display text-lg font-bold", className)}
    >
      <span aria-hidden className="h-5 w-1.5 -skew-x-12 rounded-[2px] bg-accent" />
      <span className="tracking-tight text-ink">{APP_NAME}</span>
    </span>
  );
}
