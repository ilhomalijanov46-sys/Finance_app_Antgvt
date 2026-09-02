-- Missing columns that the app has been writing since the transaction time /
-- income payment method features landed. Without them every INSERT into
-- incomes (and expenses) is rejected by PostgREST with PGRST204.

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';

-- Stored as the plain 'HH:mm' string the <input type="time"> produces, so the
-- value is displayed back exactly as it was entered.
ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS time TEXT;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS time TEXT;

-- PostgREST caches the schema; without this the new columns stay invisible to
-- the API until the project restarts.
NOTIFY pgrst, 'reload schema';
