import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { Budget } from '../types';

export const budgetService = {
  getAll: async (userId: string): Promise<Budget[]> => {
    // If Demo user mode
    if (userId === 'demo-user-777' || !isSupabaseConfigured || !supabase) {
      return localDemoStore.getBudgets();
    }

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error('Failed to fetch budgets from Supabase:', error);
      throw error;
    }

    return (data as Budget[]) || [];
  },

  createOrUpdate: async (budget: Omit<Budget, 'id' | 'created_at'>): Promise<Budget> => {
    if (isSupabaseConfigured && supabase && budget.user_id !== 'demo-user-777') {
      const { data, error } = await supabase
        .from('budgets')
        .upsert([budget], { onConflict: 'user_id,category' })
        .select()
        .single();

      if (error) {
        console.error('Failed to save budget in Supabase:', error);
        throw error;
      }

      if (data) {
        return data as Budget;
      }
    }

    // Fallback for Demo mode
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
    if (!isDemoContext() && supabase) {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete budget in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getBudgets();
    localDemoStore.setBudgets(current.filter((item) => item.id !== id));
  },
};
