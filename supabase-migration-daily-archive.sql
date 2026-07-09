-- ============================================================
-- φιλοσοφία · Daily Archives Migration
-- Run this in your Supabase SQL Editor to enable daily
-- debate & poll history storage.
-- ============================================================

-- Safe upgrade: add the label column if the table already exists.
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

-- Ensure one entry per date per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_archive_date_type
    ON daily_archive(archive_date, archive_type);

-- Allow public inserts (for anonymous users)
ALTER TABLE daily_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to daily_archive"
    ON daily_archive FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow public select from daily_archive"
    ON daily_archive FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow public upsert to daily_archive"
    ON daily_archive FOR UPDATE
    TO anon
    USING (true)
    WITH CHECK (true);

-- Optional: clean up old entries after 90 days
-- CREATE POLICY "Allow delete of old archives"
--     ON daily_archive FOR DELETE
--     TO anon
--     USING (archive_date < NOW() - INTERVAL '90 days');
