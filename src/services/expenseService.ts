import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { Expense } from '../types';

export const expenseService = {
  getAll: async (userId: string): Promise<Expense[]> => {
    // If Demo user mode
    if (userId === 'demo-user-777' || !isSupabaseConfigured || !supabase) {
      return localDemoStore.getExpenses();
    }

    // Real Supabase user
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch expenses from Supabase:', error);
      return [];
    }

    return (data as Expense[]) || [];
  },

  create: async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> => {
    if (isSupabaseConfigured && supabase && expense.user_id !== 'demo-user-777') {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) {
        console.error('Failed to create expense in Supabase:', error);
        throw error;
      }

      if (data) {
        return data as Expense;
      }
    }

    // Fallback for Demo mode
    const newExpense: Expense = {
      ...expense,
      id: 'exp-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getExpenses();
    localDemoStore.setExpenses([newExpense, ...current]);
    return newExpense;
  },

  update: async (id: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>): Promise<Expense> => {
    if (!isDemoContext() && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update expense in Supabase:', error);
        throw error;
      }

      if (!data) throw new Error('Expense not found');
      return data as Expense;
    }

    // Demo mode
    const current = localDemoStore.getExpenses();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setExpenses(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Expense not found');
    return result;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext() && supabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete expense in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getExpenses();
    localDemoStore.setExpenses(current.filter((item) => item.id !== id));
  },
};
