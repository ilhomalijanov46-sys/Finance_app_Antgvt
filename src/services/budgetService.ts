import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { Budget } from '../types';

export const budgetService = {
  getAll: async (userId: string): Promise<Budget[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

      if (!error && data) {
        return data as Budget[];
      }
    }
    // Fallback
    return localDemoStore.getBudgets().filter((b) => !userId || b.user_id === userId || userId === 'demo-user-777');
  },

  createOrUpdate: async (budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('budgets')
        .upsert([budget], { onConflict: 'user_id,category' })
        .select()
        .single();

      if (!error && data) {
        return data as Budget;
      }
    }
    // Fallback
    const current = localDemoStore.getBudgets();
    const existingIndex = current.findIndex((b) => b.category === budget.category);
    if (existingIndex >= 0) {
      const updatedItem = { ...current[existingIndex], ...budget };
      current[existingIndex] = updatedItem;
      localDemoStore.setBudgets([...current]);
      return updatedItem;
    } else {
      const newBudget: Budget = {
        ...budget,
        id: 'bud-' + Date.now(),
        created_at: new Date().toISOString(),
      };
      localDemoStore.setBudgets([newBudget, ...current]);
      return newBudget;
    }
  },

  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (!error) return;
    }
    // Fallback
    const current = localDemoStore.getBudgets();
    localDemoStore.setBudgets(current.filter((item) => item.id !== id));
  },
};
