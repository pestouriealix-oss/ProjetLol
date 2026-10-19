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
  /** Modèle qui écrit les fiches (« claude-haiku-5-5 » pour l'essayer). Par défaut, Sonnet. */
  DRAFT_SHEET_MODEL: optional,
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
