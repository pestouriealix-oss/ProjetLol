/**
 * Configuration centrale de l'application.
 * Le nom du produit n'est pas encore arrêté : il vit ici et nulle part ailleurs.
 */
export const APP_NAME = "Coach";

export const ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"] as const;
export type Role = (typeof ROLES)[number];

/** Nombre maximum de rôles principaux par compte Riot. */
export const MAX_ROLES_PER_ACCOUNT = 2;

/**
 * Plateformes Riot et leur route régionale (utilisée par Account-V1 et
 * Match-V5). L'ordre est celui affiché dans le sélecteur.
 */
export const PLATFORMS = {
  EUW1: { label: "Europe Ouest", short: "EUW", routing: "europe" },
  EUN1: { label: "Europe Nord et Est", short: "EUNE", routing: "europe" },
  TR1: { label: "Turquie", short: "TR", routing: "europe" },
  RU: { label: "Russie", short: "RU", routing: "europe" },
  ME1: { label: "Moyen-Orient", short: "ME", routing: "europe" },
  NA1: { label: "Amérique du Nord", short: "NA", routing: "americas" },
  BR1: { label: "Brésil", short: "BR", routing: "americas" },
  LA1: { label: "Amérique latine Nord", short: "LAN", routing: "americas" },
  LA2: { label: "Amérique latine Sud", short: "LAS", routing: "americas" },
  KR: { label: "Corée", short: "KR", routing: "asia" },
  JP1: { label: "Japon", short: "JP", routing: "asia" },
  OC1: { label: "Océanie", short: "OCE", routing: "sea" },
  SG2: { label: "Asie du Sud-Est", short: "SEA", routing: "sea" },
  TW2: { label: "Taïwan", short: "TW", routing: "sea" },
  VN2: { label: "Viêt Nam", short: "VN", routing: "sea" },
} as const satisfies Record<string, { label: string; short: string; routing: string }>;

export type Platform = keyof typeof PLATFORMS;
export const PLATFORM_IDS = Object.keys(PLATFORMS) as [Platform, ...Platform[]];
export const DEFAULT_PLATFORM: Platform = "EUW1";

export const PLANS = ["FREE", "PREMIUM"] as const;
export type Plan = (typeof PLANS)[number];

/** Mention exigée par Riot, à afficher telle quelle (en anglais). */
export const RIOT_DISCLAIMER = `${APP_NAME} isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.`;
