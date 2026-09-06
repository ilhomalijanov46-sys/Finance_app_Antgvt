-- Schema hardening: indexes, constraints, and RLS/function security the initial
-- migrations shipped without. Nothing here changes application behavior for data
-- that was already valid; it closes gaps a client bug or a hand-crafted API call
-- could otherwise slip through.

-- 1. Indexes. Every read the app does is `.eq('user_id', ...)` combined with
-- `.order('date')`, and every RLS policy evaluates `auth.uid() = user_id` per row —
-- both were doing full table scans without an index to use.
CREATE INDEX IF NOT EXISTS incomes_user_date_idx ON public.incomes (user_id, date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx ON public.expenses (user_id, date DESC);
CREATE INDEX IF NOT EXISTS budgets_user_idx ON public.budgets (user_id);
CREATE INDEX IF NOT EXISTS goals_user_idx ON public.goals (user_id);

-- 2. Budgets were unique on (user_id, category), silently ignoring `period` — a
-- monthly and a weekly budget on the same category could not coexist; upserting the
-- second replaced the first outright, period and all.
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_key;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_user_category_period_key UNIQUE (user_id, category, period);

-- 3. CHECK constraints on the columns the app treats as closed enums. Without these,
-- a hand-crafted API call (or a bug elsewhere in the app) could write a value none of
-- the UI's switch statements handle, which then renders as nothing or crashes a page
-- expecting one of a fixed set of strings.
--
-- DROP ... IF EXISTS before every ADD CONSTRAINT here: this project's actual remote
-- schema was originally hand-run from an inline SQL script (since replaced — see
-- DOCUMENTATION.md's history) rather than these migration files from a clean slate, and
-- a plain unnamed `CHECK (...)` on a column creates a constraint under exactly this
-- auto-generated `<table>_<column>_check` name — so some of these already exist under
-- these names on tables that got their check constraint from that original script,
-- while others (added to a column later, e.g. incomes.payment_method) do not.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_currency_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_locale_check;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_theme_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_currency_check CHECK (currency IN ('USD', 'UZS', 'EUR', 'RUB')),
  ADD CONSTRAINT profiles_locale_check CHECK (locale IN ('ru', 'en', 'uz')),
  ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('light', 'dark', 'system'));

ALTER TABLE public.incomes DROP CONSTRAINT IF EXISTS incomes_payment_method_check;
ALTER TABLE public.incomes
  ADD CONSTRAINT incomes_payment_method_check CHECK (payment_method IN ('card', 'cash', 'transfer'));

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_payment_method_check;
ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_payment_method_check CHECK (payment_method IN ('card', 'cash', 'transfer'));

ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_period_check;
ALTER TABLE public.budgets
  ADD CONSTRAINT budgets_period_check CHECK (period IN ('monthly', 'weekly', 'yearly'));

-- A goal's progress cannot exceed its own target — the UI already clamps deposits at
-- the target with LEAST(), but editing a goal's amount directly bypassed that.
ALTER TABLE public.goals DROP CONSTRAINT IF EXISTS goals_current_within_target_check;
ALTER TABLE public.goals
  ADD CONSTRAINT goals_current_within_target_check CHECK (current_amount <= target_amount);

-- 4. RLS policies re-evaluated auth.uid() once per row scanned. Wrapping it in a
-- sub-select lets Postgres compute it once per statement instead — the officially
-- documented RLS performance pattern for Supabase/Postgres.
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own incomes" ON public.incomes;
DROP POLICY IF EXISTS "Users can manage own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can manage own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can manage own goals" ON public.goals;

CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "Users can manage own incomes" ON public.incomes
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can manage own expenses" ON public.expenses
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can manage own budgets" ON public.budgets
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can manage own goals" ON public.goals
  FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

-- 5. handle_new_user() is SECURITY DEFINER (runs as the function owner, typically
-- postgres) without a pinned search_path — a classic Postgres privilege-escalation
-- gap: a malicious `public` schema object of the same name as one referenced inside
-- the function body could otherwise be resolved instead of the intended one.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

NOTIFY pgrst, 'reload schema';
