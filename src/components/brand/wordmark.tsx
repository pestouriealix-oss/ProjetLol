import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/cn";

import { Slash } from "./slash";

/**
 * Logo typographique provisoire. Le nom vient de `APP_NAME` : le jour où il
 * change, le logo suit. Au survol du lien qui le contient, la barre s'incline.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("group/wordmark inline-flex items-center gap-2 text-2xl", className)}>
      <Slash className="h-[0.82em] text-accent transition-[rotate,scale] duration-(--duration-slow) ease-(--ease-spring-bouncy) group-hover/wordmark:scale-110 group-hover/wordmark:rotate-12" />
      <span className="display leading-none tracking-[0.03em] text-ink">{APP_NAME}</span>
    </span>
  );
}
