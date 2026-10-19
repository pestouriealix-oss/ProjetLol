import Image from "next/image";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";

const tiers = t.dashboard.rank.tiers;

/** Au-dessus de Diamant, il n'y a plus de division. */
const APEX_TIERS = new Set(["MASTER", "GRANDMASTER", "CHALLENGER"]);

/** Teinte de chaque palier (jetons `--color-tier-*` de globals.css). */
const TIER_TEXT: Record<string, string> = {
  IRON: "text-tier-iron",
  BRONZE: "text-tier-bronze",
  SILVER: "text-tier-silver",
  GOLD: "text-tier-gold",
  PLATINUM: "text-tier-platinum",
  EMERALD: "text-tier-emerald",
  DIAMOND: "text-tier-diamond",
  MASTER: "text-tier-master",
  GRANDMASTER: "text-tier-grandmaster",
  CHALLENGER: "text-tier-challenger",
};

/**
 * Paliers dont l'emblème officiel est dans `public/ranked-emblems` : les
 * emblèmes que Riot fournit aux développeurs (portail développeur, « Ranked
 * Emblems Latest »), recadrés et réduits en WebP 160 × 120. Un palier inconnu
 * garde seulement sa couleur.
 */
const EMBLEM_TIERS: ReadonlySet<string> = new Set(Object.keys(TIER_TEXT));

export type RankValue = { tier: string; division: string };

/** « Émeraude III », « Maître ». */
export function rankText({ tier, division }: RankValue): string {
  return `${tiers[tier] ?? tier}${APEX_TIERS.has(tier) ? "" : ` ${division}`}`;
}

export function tierTextClass(tier: string): string {
  return TIER_TEXT[tier] ?? "text-ink";
}

/** L'emblème officiel du palier, s'il est disponible (décoratif : le nom l'accompagne toujours). */
export function RankEmblem({ tier, className }: { tier: string; className?: string }) {
  if (!EMBLEM_TIERS.has(tier)) return null;
  return (
    <Image
      src={`/ranked-emblems/${tier.toLowerCase()}.webp`}
      alt=""
      width={160}
      height={120}
      unoptimized
      // Cadre 4:3 : les emblèmes sont plus larges que hauts (leurs ailes).
      className={cn("aspect-[4/3] h-4 w-auto shrink-0 object-contain", className)}
    />
  );
}

/**
 * Le rang d'un joueur : emblème et nom du palier, dans la couleur du palier.
 * `null` : pas classé dans cette file.
 */
export function RankBadge({
  rank,
  unranked,
  className,
  emblemClassName,
}: {
  rank: RankValue | null;
  /** Texte quand le joueur n'est pas classé. */
  unranked: string;
  className?: string;
  emblemClassName?: string;
}) {
  if (!rank) return <span className={cn("text-ink-faint", className)}>{unranked}</span>;
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <RankEmblem tier={rank.tier} className={emblemClassName} />
      <span className={cn("font-semibold", tierTextClass(rank.tier))}>{rankText(rank)}</span>
    </span>
  );
}
