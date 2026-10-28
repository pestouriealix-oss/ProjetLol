import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format";
import { showsWinrate } from "@/lib/stats/sample";

const copy = t.stats;

/**
 * Taux de victoire : le chiffre, et une barre fine (jamais la couleur seule).
 * Sur trop peu de parties, le bilan brut remplace le pourcentage, en retrait.
 */
export function Winrate({
  wins,
  games,
  size = "sm",
}: {
  wins: number;
  games: number;
  /** `lg` : le chiffre seul, en grand, pour les listes du tableau de bord. */
  size?: "sm" | "lg";
}) {
  if (!showsWinrate(games)) {
    return (
      <span
        title={copy.smallSample(wins, games - wins)}
        className="text-sm whitespace-nowrap text-ink-muted tabular"
      >
        <span aria-hidden>{copy.record(wins, games - wins)}</span>
        <span className="sr-only">{copy.smallSample(wins, games - wins)}</span>
      </span>
    );
  }

  const ratio = wins / games;
  if (size === "lg") {
    return <span className="display text-xl text-ink tabular">{formatPercent(ratio)}</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-10 text-right tabular">{formatPercent(ratio)}</span>
      <span aria-hidden className="h-1.5 w-12 overflow-hidden rounded-pill bg-field max-sm:hidden">
        <span
          className={cn("block h-full rounded-pill", ratio >= 0.5 ? "bg-win" : "bg-loss")}
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </span>
    </span>
  );
}
