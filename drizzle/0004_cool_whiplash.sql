CREATE TABLE "champion_role_stats" (
	"patch" text NOT NULL,
	"role" "role" NOT NULL,
	"champion" integer NOT NULL,
	"games" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "champion_role_stats_patch_role_champion_pk" PRIMARY KEY("patch","role","champion")
);
--> statement-breakpoint
CREATE TABLE "matchup_stats" (
	"patch" text NOT NULL,
	"role" "role" NOT NULL,
	"champion" integer NOT NULL,
	"opponent" integer NOT NULL,
	"games" integer DEFAULT 0 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "matchup_stats_patch_role_champion_opponent_pk" PRIMARY KEY("patch","role","champion","opponent")
);
--> statement-breakpoint
CREATE TABLE "stat_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"platform" "platform" NOT NULL,
	"patch" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stat_matches_patch_idx" ON "stat_matches" USING btree ("patch");