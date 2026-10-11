CREATE TYPE "public"."llm_call_kind" AS ENUM('DRAFT_EXTRACTION', 'DRAFT_ANALYSIS', 'MATCH_REVIEW', 'TREND_SUMMARY');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('FREE', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."plan_followed" AS ENUM('YES', 'PARTLY', 'NO');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('EUW1', 'EUN1', 'TR1', 'RU', 'ME1', 'NA1', 'BR1', 'LA1', 'LA2', 'KR', 'JP1', 'OC1', 'SG2', 'TW2', 'VN2');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT');--> statement-breakpoint
CREATE TYPE "public"."side" AS ENUM('BLUE', 'RED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "draft_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"riot_account_id" text,
	"match_id" text,
	"patch" text NOT NULL,
	"my_champion" text NOT NULL,
	"my_role" "role",
	"allies" jsonb NOT NULL,
	"enemies" jsonb NOT NULL,
	"runes" jsonb,
	"content" jsonb NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_usages" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" "llm_call_kind" NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"cost_micro_usd" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"participation_id" text NOT NULL,
	"strengths" jsonb NOT NULL,
	"improvements" jsonb NOT NULL,
	"plan_followed" "plan_followed",
	"summary" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_reviews_participation_id_unique" UNIQUE("participation_id")
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" "platform" NOT NULL,
	"patch" text NOT NULL,
	"queue_id" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"duration_seconds" integer NOT NULL,
	"details" jsonb NOT NULL,
	"timeline" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"match_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participations" (
	"id" text PRIMARY KEY NOT NULL,
	"riot_account_id" text NOT NULL,
	"match_id" text NOT NULL,
	"champion_id" integer NOT NULL,
	"champion_name" text NOT NULL,
	"role" "role",
	"side" "side" NOT NULL,
	"win" boolean NOT NULL,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"cs" integer NOT NULL,
	"gold" integer NOT NULL,
	"damage_to_champions" integer NOT NULL,
	"vision_score" integer NOT NULL,
	"kill_participation" real NOT NULL,
	"stats" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rank_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"riot_account_id" text NOT NULL,
	"queue" text NOT NULL,
	"tier" text NOT NULL,
	"division" text NOT NULL,
	"lp" integer NOT NULL,
	"wins" integer NOT NULL,
	"losses" integer NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riot_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"game_name" text NOT NULL,
	"tag_line" text NOT NULL,
	"platform" "platform" NOT NULL,
	"puuid" text,
	"roles" "role"[] DEFAULT '{}'::role[] NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password_hash" text,
	"plan" "plan" DEFAULT 'FREE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_analyses" ADD CONSTRAINT "draft_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_analyses" ADD CONSTRAINT "draft_analyses_riot_account_id_riot_accounts_id_fk" FOREIGN KEY ("riot_account_id") REFERENCES "public"."riot_accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draft_analyses" ADD CONSTRAINT "draft_analyses_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usages" ADD CONSTRAINT "llm_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_reviews" ADD CONSTRAINT "match_reviews_participation_id_participations_id_fk" FOREIGN KEY ("participation_id") REFERENCES "public"."participations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_riot_account_id_riot_accounts_id_fk" FOREIGN KEY ("riot_account_id") REFERENCES "public"."riot_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participations" ADD CONSTRAINT "participations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rank_snapshots" ADD CONSTRAINT "rank_snapshots_riot_account_id_riot_accounts_id_fk" FOREIGN KEY ("riot_account_id") REFERENCES "public"."riot_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riot_accounts" ADD CONSTRAINT "riot_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "draft_analyses_user_idx" ON "draft_analyses" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "draft_analyses_match_idx" ON "draft_analyses" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "llm_usages_quota_idx" ON "llm_usages" USING btree ("user_id","kind","created_at");--> statement-breakpoint
CREATE INDEX "matches_started_idx" ON "matches" USING btree ("started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_user_match_idx" ON "notes" USING btree ("user_id","match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "participations_account_match_idx" ON "participations" USING btree ("riot_account_id","match_id");--> statement-breakpoint
CREATE INDEX "participations_match_idx" ON "participations" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "rank_snapshots_lookup_idx" ON "rank_snapshots" USING btree ("riot_account_id","queue","taken_at");--> statement-breakpoint
CREATE UNIQUE INDEX "riot_accounts_identity_idx" ON "riot_accounts" USING btree ("user_id","platform",lower("game_name"),lower("tag_line"));--> statement-breakpoint
CREATE UNIQUE INDEX "riot_accounts_user_puuid_idx" ON "riot_accounts" USING btree ("user_id","puuid");--> statement-breakpoint
CREATE INDEX "riot_accounts_user_idx" ON "riot_accounts" USING btree ("user_id");