CREATE TYPE "public"."consent_purpose" AS ENUM('service', 'marketing', 'guardian');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'prefer_not');--> statement-breakpoint
CREATE TYPE "public"."login_kind" AS ENUM('gamer', 'staff');--> statement-breakpoint
CREATE TYPE "public"."referral_source" AS ENUM('instagram', 'google', 'friend', 'walk_in', 'whatsapp', 'other');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('staff', 'admin');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_staff_id" uuid,
	"actor_gamer_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"gamer_id" uuid,
	"staff_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "auth_sessions_one_subject" CHECK (num_nonnulls("auth_sessions"."gamer_id", "auth_sessions"."staff_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gamer_id" uuid NOT NULL,
	"purpose" "consent_purpose" NOT NULL,
	"granted" boolean NOT NULL,
	"notice_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_code" text NOT NULL,
	"email" text,
	"password_hash" text,
	"full_name" text,
	"phone" text,
	"birth_year" integer,
	"gender" "gender",
	"area" text NOT NULL,
	"pincode" char(6) NOT NULL,
	"referral_source" "referral_source" NOT NULL,
	"favourite_games" text[] DEFAULT '{}'::text[] NOT NULL,
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "gamers_member_code_unique" UNIQUE("member_code"),
	CONSTRAINT "gamers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" "login_kind" NOT NULL,
	"identifier" text NOT NULL,
	"succeeded" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "staff_role" DEFAULT 'staff' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "staff_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_staff_id_staff_id_fk" FOREIGN KEY ("actor_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_gamer_id_gamers_id_fk" FOREIGN KEY ("actor_gamer_id") REFERENCES "public"."gamers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "auth_sessions_gamer_idx" ON "auth_sessions" USING btree ("gamer_id");--> statement-breakpoint
CREATE INDEX "auth_sessions_staff_idx" ON "auth_sessions" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "consents_gamer_idx" ON "consents" USING btree ("gamer_id");--> statement-breakpoint
CREATE INDEX "gamers_phone_idx" ON "gamers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "gamers_pincode_idx" ON "gamers" USING btree ("pincode");--> statement-breakpoint
CREATE INDEX "login_attempts_lookup_idx" ON "login_attempts" USING btree ("kind","identifier","created_at");