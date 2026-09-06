import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { Budget } from '../types';

export const budgetService = {
  getAll: async (userId: string): Promise<Budget[]> => {
    if (isDemoContext()) {
      return localDemoStore.getBudgets();
    }

    const { data, error } = await supabase!
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      // Without an explicit order Postgres makes no promise about row order, so the
      // budget cards used to reshuffle themselves on every reload.
      .order('created_at', { ascending: true });

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error('Failed to fetch budgets from Supabase:', error);
      throw error;
    }

    return (data as Budget[]) || [];
  },

  createOrUpdate: async (budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> => {
    if (!isDemoContext()) {
      // A budget is unique per (category, period) — see migration 004 — so replacing
      // one requires matching on both, not just the category.
      const { data, error } = await supabase!
        .from('budgets')
        .upsert([budget], { onConflict: 'user_id,category,period' })
        .select()
        .single();

      if (error) {
        console.error('Failed to save budget in Supabase:', error);
        throw error;
      }

      return data as Budget;
    }

    // Demo mode
    const current = localDemoStore.getBudgets();
    const existingIndex = current.findIndex(
      (b) => b.category === budget.category && b.period === budget.period
    );
    if (existingIndex >= 0) {
      const updatedItem = { ...current[existingIndex], ...budget };
      const next = [...current];
      next[existingIndex] = updatedItem;
      assertWritten(localDemoStore.setBudgets(next));
      return updatedItem;
    }

    const newBudget: Budget = {
      ...budget,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    assertWritten(localDemoStore.setBudgets([newBudget, ...current]));
    return newBudget;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!.from('budgets').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete budget in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getBudgets();
    assertWritten(localDemoStore.setBudgets(current.filter((item) => item.id !== id)));
  },
};
