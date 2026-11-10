import "server-only";
import { z } from "zod";

/** Une variable laissée vide dans .env vaut "absente". */
const optional = z
  .string()
  .optional()
  .transform((value) => (value && value.trim() !== "" ? value : undefined));

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requise"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET est requise (openssl rand -base64 33)"),
  AUTH_DISCORD_ID: optional,
  AUTH_DISCORD_SECRET: optional,
  RIOT_API_KEY: optional,
  /** Clé de l'API Anthropic (coach de draft). Sans elle, la page l'explique. */
  ANTHROPIC_API_KEY: optional,
  /** Autre adresse pour l'API Anthropic (tests). */
  ANTHROPIC_BASE_URL: optional,
  /** Modèle qui écrit les fiches et les bilans. Par défaut, Haiku ; « claude-sonnet-5-5 » pour comparer. */
  DRAFT_SHEET_MODEL: optional,
  /**
   * Modèle qui écrit le duel contre le vis-à-vis. Par défaut, Sonnet : le texte
   * est écrit une fois par duel et par patch, puis resservi à tous.
   */
  MATCHUP_MODEL: optional,
  /** Plafond de dépense mensuelle du modèle, en dollars : au-delà, les fiches gratuites s'arrêtent. */
  LLM_MONTHLY_BUDGET_USD: optional.pipe(
    z
      .string()
      .regex(/^\d+(\.\d+)?$/, "LLM_MONTHLY_BUDGET_USD doit être un nombre")
      .transform(Number)
      .optional(),
  ),
  /** Autre adresse pour l'API Riot (tests). Par défaut, les serveurs de Riot. */
  RIOT_API_BASE_URL: optional,
  /** Autre adresse pour Data Dragon (miroir, tests). Par défaut, celle de Riot. */
  DDRAGON_BASE_URL: optional,
  /** Clé de PandaScore (onglet Esport). Sans elle, l'onglet explique qu'elle manque. */
  PANDASCORE_TOKEN: optional,
  /** Autre adresse pour PandaScore (tests). */
  PANDASCORE_BASE_URL: optional,
  /** Serveur de flux RSS de test (un fichier `<source>.xml` par site). Par défaut, les vrais sites. */
  NEWS_FEEDS_BASE_URL: optional,
  /** Paddle (paiement de Premium) : « sandbox » pour les tests, « production » en ligne. */
  PADDLE_ENV: z.enum(["sandbox", "production"]).optional().default("sandbox"),
  /** Clé d'API Paddle (côté serveur uniquement). */
  PADDLE_API_KEY: optional,
  /** Jeton client Paddle (« test_… » ou « live_… ») : il est public, il ouvre le paiement dans la page. */
  PADDLE_CLIENT_TOKEN: optional,
  /** Clé secrète des notifications Paddle (« pdl_ntfset_… »), pour vérifier leur signature. */
  PADDLE_WEBHOOK_SECRET: optional,
  /** Prix de Premium au mois chez Paddle (« pri_… »). */
  PADDLE_PRICE_ID: optional,
  /** Prix de Premium à l'année (« pri_… »). Sans lui, seule l'offre au mois est proposée. */
  PADDLE_PRICE_ID_YEARLY: optional,
  /**
   * Prix au mois garanti aux fondateurs (comptes venus par invitation). Vide
   * tant que le prix public n'a pas changé ; le jour où il monte, on y met
   * l'ancien prix (2,99 €) et `PADDLE_PRICE_ID` reçoit le nouveau.
   */
  PADDLE_PRICE_ID_FOUNDERS: optional,
  /** Autre adresse pour l'API Paddle (tests). */
  PADDLE_API_BASE_URL: optional,
  /** Client Riot Sign On (« Se connecter avec Riot »), donné par Riot avec la clé de production. */
  RIOT_RSO_CLIENT_ID: optional,
  RIOT_RSO_CLIENT_SECRET: optional,
  /** Autres adresses pour Riot Sign On (tests). */
  RIOT_RSO_BASE_URL: optional,
  /** Adresse publique du site (« https://gufo.gg ») : les liens des e-mails pointent dessus. */
  APP_URL: optional,
  /** Donnée par Vercel en ligne : l'adresse de production, sans « https:// ». */
  VERCEL_PROJECT_PRODUCTION_URL: optional,
  /** Clé de Resend (envoi des e-mails). Sans elle, les e-mails sont écrits dans le terminal. */
  RESEND_API_KEY: optional,
  /** Expéditeur des e-mails (« Gufo <bonjour@gufo.gg> »), sur un domaine vérifié chez Resend. */
  EMAIL_FROM: optional,
  /** Autre adresse pour l'API de Resend (tests). */
  RESEND_API_BASE_URL: optional,
  /**
   * « invite » (par défaut) : on ne s'inscrit qu'avec un code d'invitation, les
   * autres rejoignent la liste d'attente. C'est la règle de la clé Personal de
   * Riot (une petite communauté privée). « open » le jour du lancement public.
   */
  SIGNUP_MODE: z.enum(["invite", "open"]).optional().default("invite"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Configuration invalide. Vérifie ton fichier .env :\n${details}`);
}

export const env = parsed.data;

export const isDiscordEnabled = Boolean(env.AUTH_DISCORD_ID && env.AUTH_DISCORD_SECRET);

/** Vrai tant que l'inscription demande un code d'invitation. */
export const isInviteOnly = env.SIGNUP_MODE === "invite";
