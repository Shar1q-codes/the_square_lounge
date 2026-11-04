-- Same rule as 0001: server-only access, so Supabase's public Data API sees nothing.
ALTER TABLE "cafe_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "cafe_order_items" ENABLE ROW LEVEL SECURITY;
