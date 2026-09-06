import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { expenseService } from './expenseService';
import { Goal } from '../types';
import { toDateKey } from '../utils/formatters';
import i18n from '../i18n/i18n';

export interface GoalDepositResult {
  goal: Goal;
  applied: number;
}

export const goalService = {
  getAll: async (userId: string): Promise<Goal[]> => {
    if (isDemoContext()) {
      return localDemoStore.getGoals();
    }

    const { data, error } = await supabase!
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error('Failed to fetch goals from Supabase:', error);
      throw error;
    }

    return (data as Goal[]) || [];
  },

  create: async (goal: Omit<Goal, 'id' | 'created_at'>): Promise<Goal> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
        .from('goals')
        .insert([goal])
        .select()
        .single();

      if (error) {
        console.error('Failed to create goal in Supabase:', error);
        throw error;
      }

      return data as Goal;
    }

    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getGoals();
    assertWritten(localDemoStore.setGoals([newGoal, ...current]));
    return newGoal;
  },

  update: async (id: string, updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>): Promise<Goal> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update goal in Supabase:', error);
        throw error;
      }

      if (!data) throw new Error('Goal not found');
      return data as Goal;
    }

    // Demo mode
    const current = localDemoStore.getGoals();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    assertWritten(localDemoStore.setGoals(updated));
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Goal not found');
    return result;
  },

  /**
   * Deposits into a goal and records the linked expense that funds it, as a single
   * operation. For a real account both steps run inside one Postgres transaction (the
   * deposit_to_goal RPC, migration 005): the goal row is locked with FOR UPDATE so two
   * concurrent deposits serialize instead of racing a client-side read-modify-write
   * (which used to let one of two simultaneous deposits silently vanish while both
   * still charged the balance), and the linked expense insert failing rolls the goal
   * update back too instead of leaving the goal credited with no matching expense.
   * The local demo store has no transactions, so its two writes stay best-effort
   * sequential, same as before.
   */
  deposit: async (id: string, amount: number, goalTitle?: string): Promise<GoalDepositResult> => {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const noteText = i18n.t('goals.transferNote', {
      title: goalTitle || i18n.t('goals.defaultTitle'),
    });

    if (!isDemoContext()) {
      const { data, error } = await supabase!.rpc('deposit_to_goal', {
        p_goal_id: id,
        p_amount: amount,
        p_expense_category: 'transfer',
        p_expense_payment_method: 'card',
        p_expense_date: toDateKey(now),
        p_expense_time: timeStr,
        p_expense_note: noteText,
      });

      if (error) {
        console.error('Failed to deposit to goal in Supabase:', error);
        throw error;
      }
      if (!data) throw new Error('Goal not found');

      const result = data as { goal: Goal; applied: number };
      return { goal: result.goal, applied: Number(result.applied) };
    }

    // Demo mode
    const current = localDemoStore.getGoals();
    const goal = current.find((g) => g.id === id);
    if (!goal) throw new Error('Goal not found');

    const previousAmount = Number(goal.current_amount || 0);
    const newAmount = Math.min(goal.target_amount, previousAmount + amount);
    const applied = newAmount - previousAmount;

    const updated = await goalService.update(id, { current_amount: newAmount });

    if (applied > 0) {
      await expenseService.create({
        user_id: goal.user_id,
        amount: applied,
        category: 'transfer',
        payment_method: 'card',
        date: toDateKey(now),
        time: timeStr,
        note: noteText,
      });
    }

    return { goal: updated, applied };
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!.from('goals').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete goal in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getGoals();
    assertWritten(localDemoStore.setGoals(current.filter((item) => item.id !== id)));
  },
};
