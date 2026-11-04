CREATE TYPE "public"."cafe_order_status" AS ENUM('new', 'preparing', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "cafe_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"item_id" text NOT NULL,
	"option_id" text NOT NULL,
	"name" text NOT NULL,
	"option" text,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "cafe_order_items_quantity_range" CHECK ("cafe_order_items"."quantity" between 1 and 20),
	CONSTRAINT "cafe_order_items_price_positive" CHECK ("cafe_order_items"."unit_price_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "cafe_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gamer_id" uuid NOT NULL,
	"station_id" integer NOT NULL,
	"session_id" uuid NOT NULL,
	"status" "cafe_order_status" DEFAULT 'new' NOT NULL,
	"total_paise" integer NOT NULL,
	"note" text,
	"handled_by" uuid,
	"cancelled_by_gamer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cafe_orders_total_positive" CHECK ("cafe_orders"."total_paise" > 0),
	CONSTRAINT "cafe_orders_note_length" CHECK ("cafe_orders"."note" is null or char_length("cafe_orders"."note") <= 200)
);
--> statement-breakpoint
ALTER TABLE "cafe_order_items" ADD CONSTRAINT "cafe_order_items_order_id_cafe_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."cafe_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_orders" ADD CONSTRAINT "cafe_orders_gamer_id_gamers_id_fk" FOREIGN KEY ("gamer_id") REFERENCES "public"."gamers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_orders" ADD CONSTRAINT "cafe_orders_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_orders" ADD CONSTRAINT "cafe_orders_session_id_play_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."play_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cafe_orders" ADD CONSTRAINT "cafe_orders_handled_by_staff_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cafe_order_items_order_idx" ON "cafe_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "cafe_orders_status_created_idx" ON "cafe_orders" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "cafe_orders_gamer_idx" ON "cafe_orders" USING btree ("gamer_id","created_at");