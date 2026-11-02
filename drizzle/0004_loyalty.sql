CREATE TYPE "public"."ledger_reason" AS ENUM('session', 'correction', 'redemption', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."offer_category" AS ENUM('gaming', 'cafe', 'other');--> statement-breakpoint
CREATE TYPE "public"."voucher_status" AS ENUM('active', 'used', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"points_cost" integer NOT NULL,
	"category" "offer_category" DEFAULT 'other' NOT NULL,
	"stock" integer,
	"max_per_gamer" integer,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offers_cost_positive" CHECK ("offers"."points_cost" > 0),
	CONSTRAINT "offers_stock_non_negative" CHECK ("offers"."stock" is null or "offers"."stock" >= 0),
	CONSTRAINT "offers_max_per_gamer_positive" CHECK ("offers"."max_per_gamer" is null or "offers"."max_per_gamer" > 0),
	CONSTRAINT "offers_dates_order" CHECK ("offers"."starts_at" is null or "offers"."ends_at" is null or "offers"."ends_at" > "offers"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"gamer_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"session_id" uuid,
	"voucher_id" uuid,
	"note" text,
	"actor_staff_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "points_ledger_delta_non_zero" CHECK ("points_ledger"."delta" <> 0)
);
--> statement-breakpoint
CREATE TABLE "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"gamer_id" uuid NOT NULL,
	"offer_id" uuid NOT NULL,
	"points_spent" integer NOT NULL,
	"status" "voucher_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"used_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_staff_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_session_id_play_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."play_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_actor_staff_id_staff_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_used_by_staff_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_one_award_per_session" ON "points_ledger" USING btree ("session_id") WHERE "points_ledger"."reason" = 'session';--> statement-breakpoint
CREATE INDEX "points_ledger_gamer_created_idx" ON "points_ledger" USING btree ("gamer_id","created_at");--> statement-breakpoint
CREATE INDEX "vouchers_gamer_idx" ON "vouchers" USING btree ("gamer_id");--> statement-breakpoint
CREATE INDEX "vouchers_offer_status_idx" ON "vouchers" USING btree ("offer_id","status");--> statement-breakpoint
CREATE INDEX "vouchers_status_expiry_idx" ON "vouchers" USING btree ("status","expires_at");