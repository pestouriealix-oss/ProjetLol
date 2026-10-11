/**
 * Schéma de base de données.
 *
 * Règle d'or : toute donnée personnelle est rattachée à un utilisateur,
 * directement ou via un compte Riot. Les parties brutes (`matches`) sont
 * partagées entre joueurs et ne contiennent rien de privé.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { PLANS, PLATFORM_IDS, ROLES } from "@/lib/config";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const planEnum = pgEnum("plan", PLANS);
export const platformEnum = pgEnum("platform", PLATFORM_IDS);
export const roleEnum = pgEnum("role", ROLES);
export const sideEnum = pgEnum("side", ["BLUE", "RED"]);
export const planFollowedEnum = pgEnum("plan_followed", ["YES", "PARTLY", "NO"]);
export const llmCallKindEnum = pgEnum("llm_call_kind", [
  "DRAFT_EXTRACTION",
  "DRAFT_ANALYSIS",
  "MATCH_REVIEW",
  "TREND_SUMMARY",
]);

// ── Utilisateurs et connexion ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  /** Absent pour les comptes créés via Discord. */
  passwordHash: text("password_hash"),
  plan: planEnum("plan").notNull().default("FREE"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/**
 * Lien vers un fournisseur de connexion externe (Discord). Table gérée par
 * Auth.js : les noms de colonnes en snake_case sont imposés par son adaptateur.
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("accounts_user_idx").on(table.userId),
  ],
);

// ── Comptes de jeu ──────────────────────────────────────────────────────────

export const riotAccounts = pgTable(
  "riot_accounts",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameName: text("game_name").notNull(),
    tagLine: text("tag_line").notNull(),
    platform: platformEnum("platform").notNull(),
    /** Identifiant Riot stable, renseigné quand le compte est vérifié via l'API. */
    puuid: text("puuid"),
    roles: roleEnum("roles")
      .array()
      .notNull()
      .default(sql`'{}'::role[]`),
    isPrimary: boolean("is_primary").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    // Insensible à la casse : « Faker#KR1 » et « faker#kr1 » sont le même compte.
    uniqueIndex("riot_accounts_identity_idx").on(
      table.userId,
      table.platform,
      sql`lower(${table.gameName})`,
      sql`lower(${table.tagLine})`,
    ),
    uniqueIndex("riot_accounts_user_puuid_idx").on(table.userId, table.puuid),
    index("riot_accounts_user_idx").on(table.userId),
  ],
);

/**
 * Relevé du rang officiel, pris à chaque synchronisation : l'API Riot ne
 * fournit pas d'historique des LP.
 */
export const rankSnapshots = pgTable(
  "rank_snapshots",
  {
    id: id(),
    riotAccountId: text("riot_account_id")
      .notNull()
      .references(() => riotAccounts.id, { onDelete: "cascade" }),
    queue: text("queue").notNull(),
    tier: text("tier").notNull(),
    division: text("division").notNull(),
    lp: integer("lp").notNull(),
    wins: integer("wins").notNull(),
    losses: integer("losses").notNull(),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("rank_snapshots_lookup_idx").on(table.riotAccountId, table.queue, table.takenAt),
  ],
);

// ── Parties ─────────────────────────────────────────────────────────────────

/**
 * Partie brute telle que renvoyée par Match-V5. Stockée une seule fois, même
 * si plusieurs utilisateurs y ont joué.
 */
export const matches = pgTable(
  "matches",
  {
    /** Identifiant Riot, par exemple « EUW1_7123456789 ». */
    id: text("id").primaryKey(),
    platform: platformEnum("platform").notNull(),
    patch: text("patch").notNull(),
    queueId: integer("queue_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    details: jsonb("details").notNull(),
    timeline: jsonb("timeline"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("matches_started_idx").on(table.startedAt)],
);

/** Performance d'un compte lié dans une partie. */
export const participations = pgTable(
  "participations",
  {
    id: id(),
    riotAccountId: text("riot_account_id")
      .notNull()
      .references(() => riotAccounts.id, { onDelete: "cascade" }),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    championId: integer("champion_id").notNull(),
    championName: text("champion_name").notNull(),
    role: roleEnum("role"),
    side: sideEnum("side").notNull(),
    win: boolean("win").notNull(),
    kills: integer("kills").notNull(),
    deaths: integer("deaths").notNull(),
    assists: integer("assists").notNull(),
    cs: integer("cs").notNull(),
    gold: integer("gold").notNull(),
    damageToChampions: integer("damage_to_champions").notNull(),
    visionScore: integer("vision_score").notNull(),
    killParticipation: real("kill_participation").notNull(),
    /** Statistiques détaillées : objectifs, comparaison avec l'adversaire direct… */
    stats: jsonb("stats").notNull(),
  },
  (table) => [
    uniqueIndex("participations_account_match_idx").on(table.riotAccountId, table.matchId),
    index("participations_match_idx").on(table.matchId),
  ],
);

// ── Coaching ────────────────────────────────────────────────────────────────

export const draftAnalyses = pgTable(
  "draft_analyses",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    riotAccountId: text("riot_account_id").references(() => riotAccounts.id, {
      onDelete: "set null",
    }),
    /** Rattachée après coup à la partie jouée (mêmes champions, horaire proche). */
    matchId: text("match_id").references(() => matches.id, { onDelete: "set null" }),
    patch: text("patch").notNull(),
    myChampion: text("my_champion").notNull(),
    myRole: roleEnum("my_role"),
    allies: jsonb("allies").notNull(),
    enemies: jsonb("enemies").notNull(),
    runes: jsonb("runes"),
    content: jsonb("content").notNull(),
    promptVersion: text("prompt_version").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    index("draft_analyses_user_idx").on(table.userId, table.createdAt),
    index("draft_analyses_match_idx").on(table.matchId),
  ],
);

export const matchReviews = pgTable("match_reviews", {
  id: id(),
  participationId: text("participation_id")
    .notNull()
    .unique()
    .references(() => participations.id, { onDelete: "cascade" }),
  strengths: jsonb("strengths").notNull(),
  improvements: jsonb("improvements").notNull(),
  planFollowed: planFollowedEnum("plan_followed"),
  summary: text("summary").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: createdAt(),
});

export const notes = pgTable(
  "notes",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("notes_user_match_idx").on(table.userId, table.matchId)],
);

/** Journal de chaque appel au modèle : sert aux quotas et au suivi des coûts. */
export const llmUsages = pgTable(
  "llm_usages",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: llmCallKindEnum("kind").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull(),
    outputTokens: integer("output_tokens").notNull(),
    /** Coût estimé en millionièmes de dollar, pour rester en entiers. */
    costMicroUsd: integer("cost_micro_usd").notNull(),
    createdAt: createdAt(),
  },
  (table) => [index("llm_usages_quota_idx").on(table.userId, table.kind, table.createdAt)],
);

export type User = typeof users.$inferSelect;
export type RiotAccount = typeof riotAccounts.$inferSelect;
