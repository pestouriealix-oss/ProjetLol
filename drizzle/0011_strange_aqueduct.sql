ALTER TABLE "riot_accounts" ADD COLUMN "owned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "riot_accounts" ADD COLUMN "ownership_icon_id" integer;--> statement-breakpoint
ALTER TABLE "riot_accounts" ADD COLUMN "ownership_expires_at" timestamp with time zone;