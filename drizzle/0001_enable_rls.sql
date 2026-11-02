-- The app reaches Postgres only from the server, as the table owner (which bypasses RLS).
-- Enabling RLS with no policies makes Supabase's public Data API (anon/authenticated keys) see nothing.
ALTER TABLE "gamers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "staff" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "login_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
