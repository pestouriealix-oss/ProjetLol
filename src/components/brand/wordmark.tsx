import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/cn";

import { Mark } from "./mark";

/**
 * Le logo : l'icône (le K, dans sa tuile, la même que l'onglet du navigateur)
 * puis le nom en entier dans la police de titre.
 *
 * Au survol du lien qui le contient, le bras corail se détache un peu plus :
 * le moment saisi.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("group/wordmark inline-flex items-center gap-[0.4em] text-2xl", className)}>
      <span
        aria-hidden
        className="grid size-[1.25em] shrink-0 place-items-center rounded-[0.28em] border border-line-strong/70 bg-raised"
      >
        <Mark
          compact
          className="h-[0.78em] text-ink"
          accentClassName="fill-accent transition-[translate] duration-(--duration-slow) ease-(--ease-spring-bouncy) group-hover/wordmark:translate-x-[0.8px] group-hover/wordmark:-translate-y-[0.8px]"
        />
      </span>
      <span className="display leading-none tracking-[0.04em] text-ink">{APP_NAME}</span>
    </span>
  );
}
