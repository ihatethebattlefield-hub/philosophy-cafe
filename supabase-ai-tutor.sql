-- Philosophy Café AI tutor usage protection.
-- Run this file once in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.ai_tutor_daily_usage (
    visitor_hash TEXT NOT NULL,
    usage_date DATE NOT NULL DEFAULT (timezone('utc', now())::date),
    request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (visitor_hash, usage_date)
);

ALTER TABLE public.ai_tutor_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_tutor_daily_usage FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ai_tutor_daily_usage TO service_role;

CREATE OR REPLACE FUNCTION public.consume_ai_tutor_quota(
    p_visitor_hash TEXT,
    p_daily_limit INTEGER DEFAULT 20,
    p_global_limit INTEGER DEFAULT 300
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_day DATE := timezone('utc', now())::date;
    visitor_count INTEGER;
    global_count INTEGER;
BEGIN
    IF p_visitor_hash IS NULL OR length(p_visitor_hash) <> 64 THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.ai_tutor_daily_usage (visitor_hash, usage_date, request_count)
    VALUES ('__global__', current_day, 1)
    ON CONFLICT (visitor_hash, usage_date)
    DO UPDATE SET request_count = ai_tutor_daily_usage.request_count + 1, updated_at = now()
    RETURNING request_count INTO global_count;

    IF global_count > greatest(1, least(p_global_limit, 100000)) THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.ai_tutor_daily_usage (visitor_hash, usage_date, request_count)
    VALUES (p_visitor_hash, current_day, 1)
    ON CONFLICT (visitor_hash, usage_date)
    DO UPDATE SET request_count = ai_tutor_daily_usage.request_count + 1, updated_at = now()
    RETURNING request_count INTO visitor_count;

    RETURN visitor_count <= greatest(1, least(p_daily_limit, 200));
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_tutor_quota(TEXT, INTEGER, INTEGER)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_tutor_quota(TEXT, INTEGER, INTEGER)
TO service_role;

-- Optional housekeeping: old rows are small, but this removes records older than 45 days.
DELETE FROM public.ai_tutor_daily_usage WHERE usage_date < current_date - 45;
