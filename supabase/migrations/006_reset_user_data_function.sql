-- Atomic account reset. The client used to DELETE each table one request at a time;
-- a failure partway through (network drop, a table momentarily unreachable) left the
-- account half-erased with no way to know which tables were cleared and which were
-- not. A single function body is one transaction: any error inside it rolls back
-- every delete, so the account is left either fully reset or entirely untouched.
CREATE OR REPLACE FUNCTION public.reset_user_data(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.incomes WHERE user_id = p_user_id;
  DELETE FROM public.expenses WHERE user_id = p_user_id;
  DELETE FROM public.budgets WHERE user_id = p_user_id;
  DELETE FROM public.goals WHERE user_id = p_user_id;
  DELETE FROM public.custom_categories WHERE user_id = p_user_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
