-- User-created income/expense categories.
--
-- These used to live only in localStorage under a single global key, which meant every
-- account on the same browser shared one list, the list never followed the user to
-- another device, and it survived a sign-out. Storing them per user in the database
-- fixes all three.

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Two categories with the same name inside one type are indistinguishable everywhere
  -- in the app (filters, charts and counters all key off the name), so they must not
  -- both exist.
  UNIQUE (user_id, type, name)
);

CREATE INDEX IF NOT EXISTS custom_categories_user_id_idx
  ON public.custom_categories (user_id);

ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own categories" ON public.custom_categories;
CREATE POLICY "Users can manage own categories"
  ON public.custom_categories
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PostgREST caches the schema; without this the new table stays invisible to the API
-- until the project restarts.
NOTIFY pgrst, 'reload schema';
