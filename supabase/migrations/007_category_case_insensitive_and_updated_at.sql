-- 1. Case-insensitive category uniqueness. UNIQUE (user_id, type, name) let "Такси"
-- and "такси" both exist under the same account — every list, filter and chart key
-- off the name as a plain string, so the two would be indistinguishable everywhere
-- they're displayed. The app already rejects an exact-case duplicate client-side
-- (see ExpenseForm/IncomeForm); this closes the gap a race between two tabs, or a
-- direct API call, could otherwise slip through. Replaces (rather than adds to) the
-- original exact-match constraint from migration 003 — case-insensitive uniqueness
-- implies exact-match uniqueness too, so keeping both would just be two indexes doing
-- overlapping work.
ALTER TABLE public.custom_categories DROP CONSTRAINT IF EXISTS custom_categories_user_id_type_name_key;
DROP INDEX IF EXISTS custom_categories_user_type_name_ci_idx;
CREATE UNIQUE INDEX custom_categories_user_type_name_ci_idx
  ON public.custom_categories (user_id, type, lower(name));

-- 2. updated_at trigger. profiles.updated_at exists but was only ever set by the
-- client remembering to include it on every write — a direct API call, or a future
-- code path that forgets, would leave it stale. A trigger makes it authoritative.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';
