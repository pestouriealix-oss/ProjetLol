import type { ReactNode } from "react";

/**
 * Liste de parties encore vide. Les lignes fantômes montrent la forme qu'elle
 * prendra (résultat, champion, score, durée) : on comprend ce qui va arriver
 * sans qu'aucune fausse donnée ne soit affichée.
 */
export function MatchListEmpty({
  title,
  body,
  action,
  rows = 4,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  rows?: number;
}) {
  return (
    <div className="relative">
      <ul
        aria-hidden
        className="flex flex-col gap-2 [mask-image:linear-gradient(to_bottom,black_15%,transparent_95%)]"
      >
        {Array.from({ length: rows }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-4 rounded-panel border border-dashed border-line-strong/50 px-4 py-3.5"
          >
            <span className="h-10 w-1 -skew-x-[14deg] rounded-[1px] bg-line-strong/50" />
            <span className="size-10 rounded-control bg-raised" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3 w-28 rounded-pill bg-raised" />
              <span className="h-2.5 w-44 max-w-full rounded-pill bg-raised/70" />
            </span>
            <span className="h-3 w-14 rounded-pill bg-raised max-sm:hidden" />
            <span className="h-3 w-10 rounded-pill bg-raised/70" />
          </li>
        ))}
      </ul>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <h3 className="display text-2xl text-ink">{title}</h3>
        <p className="max-w-[46ch] text-ink-muted">{body}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}
