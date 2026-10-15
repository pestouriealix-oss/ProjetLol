import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/cn";

import { Mark } from "./mark";

/**
 * Le nom de l'application, dont le K est la marque : un seul K, dessiné, puis
 * le reste du nom dans la police de titre. La marque prend exactement la
 * hauteur des capitales.
 *
 * Au survol du lien qui le contient, le bras corail se détache un peu plus :
 * le moment saisi.
 */
export function Wordmark({ className }: { className?: string }) {
  const rest = APP_NAME.slice(1);
  return (
    <span className={cn("group/wordmark inline-flex items-baseline text-2xl", className)}>
      <span className="sr-only">{APP_NAME}</span>
      <span aria-hidden className="inline-flex items-baseline gap-[0.07em]">
        <Mark
          className="h-[0.712em] translate-y-[0.005em] self-baseline text-ink"
          accentClassName="fill-accent transition-[translate] duration-(--duration-slow) ease-(--ease-spring-bouncy) group-hover/wordmark:translate-x-[0.6px] group-hover/wordmark:-translate-y-[0.6px]"
        />
        <span className="display leading-none tracking-[0.035em] text-ink">{rest}</span>
      </span>
    </span>
  );
}
