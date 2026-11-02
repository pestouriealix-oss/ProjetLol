import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/cn";

import { Mark } from "./mark";

/**
 * Le logo : le G-œil seul, dans sa tuile (la même que l'onglet du
 * navigateur). Le G porte le nom à lui seul ; le nom écrit reste pour les
 * lecteurs d'écran.
 *
 * Au survol du lien qui le contient, la pupille glisse un peu vers l'avant :
 * le hibou regarde.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("group/wordmark inline-flex items-center text-2xl", className)}>
      <span
        aria-hidden
        className="grid size-[1.5em] shrink-0 place-items-center rounded-[0.32em] border border-line-strong/70 bg-raised transition-colors duration-(--duration-fast) group-hover/wordmark:border-ink-faint"
      >
        <Mark
          compact
          className="h-[0.92em] text-ink"
          accentClassName="fill-accent transition-[translate] duration-(--duration-slow) ease-(--ease-spring-bouncy) group-hover/wordmark:translate-x-[0.9px] motion-reduce:transition-none"
        />
      </span>
      <span className="sr-only">{APP_NAME}</span>
    </span>
  );
}
