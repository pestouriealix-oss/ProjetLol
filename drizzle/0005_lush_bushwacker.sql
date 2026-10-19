CREATE TABLE "matchup_notes" (
	"key" text PRIMARY KEY NOT NULL,
	"patch" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "matchup_notes_patch_idx" ON "matchup_notes" USING btree ("patch");