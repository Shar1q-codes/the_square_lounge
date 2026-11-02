CREATE TYPE "public"."console" AS ENUM('PS5', 'PS4');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'upi', 'card', 'other');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('open', 'closed', 'voided');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" integer NOT NULL,
	"amount_paise" integer,
	"method" "payment_method",
	"recorded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_non_negative" CHECK ("payments"."amount_paise" is null or "payments"."amount_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "play_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gamer_id" uuid NOT NULL,
	"station_id" integer NOT NULL,
	"status" "session_status" DEFAULT 'open' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"started_by" uuid NOT NULL,
	"ended_by" uuid,
	"payment_id" uuid,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "play_sessions_open_has_no_end" CHECK (("play_sessions"."status" = 'open') = ("play_sessions"."ended_at" is null)),
	CONSTRAINT "play_sessions_end_after_start" CHECK ("play_sessions"."ended_at" is null or "play_sessions"."ended_at" > "play_sessions"."started_at")
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"console" "console" NOT NULL,
	"max_check_ins" integer DEFAULT 8 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stations_max_check_ins_range" CHECK ("stations"."max_check_ins" between 1 and 12)
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_staff_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_started_by_staff_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_ended_by_staff_id_fk" FOREIGN KEY ("ended_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_created_idx" ON "payments" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "play_sessions_one_open_per_gamer" ON "play_sessions" USING btree ("gamer_id") WHERE "play_sessions"."status" = 'open';--> statement-breakpoint
CREATE INDEX "play_sessions_station_status_idx" ON "play_sessions" USING btree ("station_id","status");--> statement-breakpoint
CREATE INDEX "play_sessions_gamer_idx" ON "play_sessions" USING btree ("gamer_id");--> statement-breakpoint
CREATE INDEX "play_sessions_started_idx" ON "play_sessions" USING btree ("started_at");