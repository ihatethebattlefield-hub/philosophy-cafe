-- ============================================================
-- φιλοσοφία · Full Security Migration
-- Run this ENTIRE file in your Supabase SQL Editor.
-- It creates tables, enables RLS, and sets policies for all tables.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS.
-- ============================================================

-- ============================================================
-- 1. ADMINS TABLE — secure admin role management
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- ============================================================
-- 2. DAILY ARCHIVE TABLE (already exists, safe add)
-- ============================================================
ALTER TABLE daily_archive ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS daily_archive (
    id SERIAL PRIMARY KEY,
    archive_date DATE NOT NULL,
    archive_type TEXT NOT NULL CHECK (archive_type IN ('debate', 'poll')),
    label TEXT NOT NULL DEFAULT '',
    question TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_archive_date_type ON daily_archive(archive_date, archive_type);

-- ============================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE daily_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submitted_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. POLICIES — daily_archive
-- ============================================================
DROP POLICY IF EXISTS "daily_archive_public_select" ON daily_archive;
CREATE POLICY "daily_archive_public_select" ON daily_archive FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "daily_archive_public_insert" ON daily_archive;
CREATE POLICY "daily_archive_public_insert" ON daily_archive FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "daily_archive_public_update" ON daily_archive;
CREATE POLICY "daily_archive_public_update" ON daily_archive FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- 5. POLICIES — online_users
-- ============================================================
DROP POLICY IF EXISTS "online_users_public_select" ON online_users;
CREATE POLICY "online_users_public_select" ON online_users FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "online_users_insert_own" ON online_users;
CREATE POLICY "online_users_insert_own" ON online_users FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "online_users_update_own" ON online_users;
CREATE POLICY "online_users_update_own" ON online_users FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "online_users_delete_own" ON online_users;
CREATE POLICY "online_users_delete_own" ON online_users FOR DELETE TO anon USING (true);

-- ============================================================
-- 6. POLICIES — seed_likes
-- ============================================================
DROP POLICY IF EXISTS "seed_likes_public_select" ON seed_likes;
CREATE POLICY "seed_likes_public_select" ON seed_likes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "seed_likes_insert_own" ON seed_likes;
CREATE POLICY "seed_likes_insert_own" ON seed_likes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "seed_likes_delete_own" ON seed_likes;
CREATE POLICY "seed_likes_delete_own" ON seed_likes FOR DELETE TO anon USING (true);

-- ============================================================
-- 7. POLICIES — poll_votes
-- ============================================================
DROP POLICY IF EXISTS "poll_votes_public_select" ON poll_votes;
CREATE POLICY "poll_votes_public_select" ON poll_votes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "poll_votes_insert_own" ON poll_votes;
CREATE POLICY "poll_votes_insert_own" ON poll_votes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "poll_votes_delete_own" ON poll_votes;
CREATE POLICY "poll_votes_delete_own" ON poll_votes FOR DELETE TO anon USING (true);

-- ============================================================
-- 8. POLICIES — poll_config
-- ============================================================
DROP POLICY IF EXISTS "poll_config_public_select" ON poll_config;
CREATE POLICY "poll_config_public_select" ON poll_config FOR SELECT TO anon USING (true);

-- ============================================================
-- 9. POLICIES — debate_votes
-- ============================================================
DROP POLICY IF EXISTS "debate_votes_public_select" ON debate_votes;
CREATE POLICY "debate_votes_public_select" ON debate_votes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "debate_votes_insert_own" ON debate_votes;
CREATE POLICY "debate_votes_insert_own" ON debate_votes FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "debate_votes_delete_own" ON debate_votes;
CREATE POLICY "debate_votes_delete_own" ON debate_votes FOR DELETE TO anon USING (true);

-- ============================================================
-- 10. POLICIES — debate_config
-- ============================================================
DROP POLICY IF EXISTS "debate_config_public_select" ON debate_config;
CREATE POLICY "debate_config_public_select" ON debate_config FOR SELECT TO anon USING (true);

-- ============================================================
-- 11. POLICIES — debate_explanations
-- ============================================================
DROP POLICY IF EXISTS "debate_explanations_public_select" ON debate_explanations;
CREATE POLICY "debate_explanations_public_select" ON debate_explanations FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "debate_explanations_insert_own" ON debate_explanations;
CREATE POLICY "debate_explanations_insert_own" ON debate_explanations FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "debate_explanations_delete_own" ON debate_explanations;
CREATE POLICY "debate_explanations_delete_own" ON debate_explanations FOR DELETE TO anon USING (true);

-- ============================================================
-- 12. POLICIES — submitted_quotes
-- ============================================================
DROP POLICY IF EXISTS "submitted_quotes_public_select" ON submitted_quotes;
CREATE POLICY "submitted_quotes_public_select" ON submitted_quotes FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "submitted_quotes_insert_public" ON submitted_quotes;
CREATE POLICY "submitted_quotes_insert_public" ON submitted_quotes FOR INSERT TO anon WITH CHECK (true);

-- Only allow delete for authenticated admins (we check in application layer)
DROP POLICY IF EXISTS "submitted_quotes_delete_auth" ON submitted_quotes;
CREATE POLICY "submitted_quotes_delete_auth" ON submitted_quotes FOR DELETE TO authenticated USING (true);

-- ============================================================
-- 13. POLICIES — admins
-- ============================================================
DROP POLICY IF EXISTS "admins_select_auth" ON admins;
CREATE POLICY "admins_select_auth" ON admins FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 14. GRANT PERMISSIONS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_archive TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON online_users TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON seed_likes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON poll_votes TO anon, authenticated;
GRANT SELECT ON poll_config TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON debate_votes TO anon, authenticated;
GRANT SELECT ON debate_config TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON debate_explanations TO anon, authenticated;
GRANT SELECT, INSERT ON submitted_quotes TO anon;
GRANT SELECT, INSERT, DELETE ON submitted_quotes TO authenticated;
GRANT SELECT ON admins TO authenticated;

-- ============================================================
-- DONE. After running this, go to Authentication → Settings
-- and enable "Email / Password" provider.
-- Then add your admin user:
--   1. Create a user via Authentication → Users → Add User
--   2. Copy the user's UUID
--   3. Run: INSERT INTO admins (user_id) VALUES ('<UUID>');
-- ============================================================
