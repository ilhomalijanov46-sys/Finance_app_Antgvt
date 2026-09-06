-- Atomic goal deposit. Previously the client read current_amount, computed the new
-- value in JavaScript, and wrote it back — two concurrent deposits (a double-click, or
-- two open tabs) could both read the same starting value, so one deposit's amount was
-- silently lost while the linked expense for it was still created and still charged
-- the balance. Separately, the linked "funds this goal" expense was created as a
-- second, independent request after the goal update; if it failed, the goal stayed
-- credited with no expense to show where the money went.
--
-- This function does both in one statement-level transaction: FOR UPDATE takes a row
-- lock on the goal so a second concurrent call blocks until the first commits (instead
-- of reading the pre-update value), and the expense insert happens before the function
-- returns — if it fails, the goal update is rolled back with it.
CREATE OR REPLACE FUNCTION public.deposit_to_goal(
  p_goal_id UUID,
  p_amount NUMERIC,
  p_expense_category TEXT DEFAULT 'transfer',
  p_expense_payment_method TEXT DEFAULT 'card',
  p_expense_date DATE DEFAULT CURRENT_DATE,
  p_expense_time TEXT DEFAULT NULL,
  p_expense_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_before NUMERIC;
  v_goal public.goals;
  v_applied NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Deposit amount must be positive';
  END IF;

  -- Row lock: a second call for the same goal blocks here until this transaction
  -- commits or rolls back, so it always reads the post-deposit value.
  SELECT current_amount INTO v_before
  FROM public.goals
  WHERE id = p_goal_id AND user_id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  UPDATE public.goals
  SET current_amount = LEAST(target_amount, v_before + p_amount)
  WHERE id = p_goal_id
  RETURNING * INTO v_goal;

  v_applied := v_goal.current_amount - v_before;

  IF v_applied > 0 THEN
    INSERT INTO public.expenses (user_id, amount, category, payment_method, date, time, note)
    VALUES (v_uid, v_applied, p_expense_category, p_expense_payment_method, p_expense_date, p_expense_time, p_expense_note);
  END IF;

  RETURN jsonb_build_object('goal', to_jsonb(v_goal), 'applied', v_applied);
END;
$$;

-- PostgREST caches the RPC list; without this the function stays invisible to
-- supabase.rpc(...) until the project restarts.
NOTIFY pgrst, 'reload schema';
