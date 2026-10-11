import type { MapRoute } from "@/components/map/geometry";
import { t } from "@/i18n/fr";
import type { PowerSeries } from "@/lib/draft/power-curve";

/**
 * Contenu de la fiche d'exemple affichée sur l'écran de connexion : Lee Sin
 * face à une composition qui protège son tireur. Données fixes, écrites à la
 * main ; la vraie fiche viendra du modèle (étape 3) avec la même forme.
 */

const copy = t.sheet.plans;

export const DEMO_PLANS = [
  { id: "invade", ...copy.invade },
  { id: "bot", ...copy.bot },
] as const;

export type DemoPlanId = (typeof DEMO_PLANS)[number]["id"];

/** Trajets dessinés sur la carte : ils partent tous de notre jungle. */
export const DEMO_ROUTES: readonly MapRoute[] = [
  // Traverse la rivière près de l'antre du bas et entre dans la jungle adverse.
  { id: "invade", d: "M50 73 C55 72 58 70 61 67 S70 58 73 47", target: [73, 47] },
  // Longe la rivière puis tombe sur la voie du bas.
  { id: "bot", d: "M50 73 C57 75 62 74 67 71 S79 73 85 77", target: [85, 77] },
];

/** Forts tôt, dépassés ensuite : l'avantage bascule vers 25 minutes. */
export const DEMO_POWER: PowerSeries = [
  { minute: 0, ours: 62, theirs: 34 },
  { minute: 8, ours: 78, theirs: 38 },
  { minute: 15, ours: 74, theirs: 46 },
  { minute: 25, ours: 56, theirs: 56 },
  { minute: 33, ours: 40, theirs: 74 },
  { minute: 40, ours: 32, theirs: 84 },
];
