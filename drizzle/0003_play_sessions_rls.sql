-- Same rule as 0001: server-only access, so Supabase's public Data API sees nothing.
ALTER TABLE "stations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "play_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
