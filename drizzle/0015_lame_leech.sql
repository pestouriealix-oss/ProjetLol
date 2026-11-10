CREATE TABLE "skipped_matches" (
	"match_id" text PRIMARY KEY NOT NULL,
	"queue_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
