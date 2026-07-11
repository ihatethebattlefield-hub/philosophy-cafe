-- ============================================================
-- φιλοσοφία · User Accounts Migration
-- Run this ENTIRE file in your Supabase SQL Editor (after the
-- full security migration). Safe to re-run.
-- ============================================================

-- ============================================================
-- 1. USER PROFILES — display names for logged-in users
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create a profile automatically after the email code is verified.
CREATE OR REPLACE FUNCTION public.handle_new_cafe_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'display_name', ''), split_part(NEW.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_cafe_user_created ON auth.users;
CREATE TRIGGER on_cafe_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_cafe_user();

-- ============================================================
-- 2. BROADEN RLS — allow logged-in (authenticated) users to
--    vote, submit quotes, like seeds, and read voter data.
--    Without this, signed-in users hit "TO anon" policies and
--    are blocked from writing/reading.
-- ============================================================
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE debate_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submitted_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_likes ENABLE ROW LEVEL SECURITY;

-- poll_votes
DROP POLICY IF EXISTS "poll_votes_public_select" ON poll_votes;
CREATE POLICY "poll_votes_public_select" ON poll_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "poll_votes_insert_own" ON poll_votes;
CREATE POLICY "poll_votes_insert_own" ON poll_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "poll_votes_delete_own" ON poll_votes;
CREATE POLICY "poll_votes_delete_own" ON poll_votes FOR DELETE TO anon, authenticated USING (true);

-- debate_votes
DROP POLICY IF EXISTS "debate_votes_public_select" ON debate_votes;
CREATE POLICY "debate_votes_public_select" ON debate_votes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "debate_votes_insert_own" ON debate_votes;
CREATE POLICY "debate_votes_insert_own" ON debate_votes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "debate_votes_delete_own" ON debate_votes;
CREATE POLICY "debate_votes_delete_own" ON debate_votes FOR DELETE TO anon, authenticated USING (true);

-- debate_explanations
DROP POLICY IF EXISTS "debate_explanations_public_select" ON debate_explanations;
CREATE POLICY "debate_explanations_public_select" ON debate_explanations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "debate_explanations_insert_own" ON debate_explanations;
CREATE POLICY "debate_explanations_insert_own" ON debate_explanations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "debate_explanations_delete_own" ON debate_explanations;
CREATE POLICY "debate_explanations_delete_own" ON debate_explanations FOR DELETE TO anon, authenticated USING (true);

-- submitted_quotes
DROP POLICY IF EXISTS "submitted_quotes_public_select" ON submitted_quotes;
CREATE POLICY "submitted_quotes_public_select" ON submitted_quotes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "submitted_quotes_insert_public" ON submitted_quotes;
CREATE POLICY "submitted_quotes_insert_public" ON submitted_quotes FOR INSERT TO anon, authenticated WITH CHECK (true);

-- seed_likes
DROP POLICY IF EXISTS "seed_likes_public_select" ON seed_likes;
CREATE POLICY "seed_likes_public_select" ON seed_likes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "seed_likes_insert_own" ON seed_likes;
CREATE POLICY "seed_likes_insert_own" ON seed_likes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "seed_likes_delete_own" ON seed_likes;
CREATE POLICY "seed_likes_delete_own" ON seed_likes FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. USER PROFILES POLICIES
-- ============================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_profiles_public_select" ON user_profiles;
CREATE POLICY "user_profiles_public_select" ON user_profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "user_profiles_upsert_own" ON user_profiles;
CREATE POLICY "user_profiles_upsert_own" ON user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
CREATE POLICY "user_profiles_update_own" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- 4. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;
GRANT SELECT, INSERT, DELETE ON poll_votes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON debate_votes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON debate_explanations TO anon, authenticated;
GRANT SELECT, INSERT ON submitted_quotes TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON seed_likes TO anon, authenticated;

-- ============================================================
-- DONE. After running:
--   - Users can sign up / sign in (Email provider, already enabled).
--   - Logged-in users' votes/quotes are tied to their real account.
--   - Admins can see who voted via the voter lists on each card.
--
-- REQUIRED DASHBOARD SETTINGS FOR THE SIX-DIGIT SIGN-UP CODE:
--   1. Authentication -> Providers -> Email:
--      Enable Email and Confirm email.
--   2. Authentication -> Email Templates -> Confirm signup:
--      Include {{ .Token }} in the subject/body instead of relying only
--      on {{ .ConfirmationURL }}. Example body:
--      <h2>Your Philosophy Cafe verification code</h2>
--      <p>Enter this six-digit code to finish creating your account:</p>
--      <p style="font-size:32px;letter-spacing:8px"><strong>{{ .Token }}</strong></p>
--   3. Configure custom SMTP before production. Supabase's default SMTP
--      only sends to pre-authorized project-team addresses.
-- ============================================================
