-- Same rule as 0001: server-only access, so Supabase's public Data API sees nothing.
ALTER TABLE "offers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vouchers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "points_ledger" ENABLE ROW LEVEL SECURITY;
