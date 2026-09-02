import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { Expense } from '../types';

export const expenseService = {
  getAll: async (userId: string): Promise<Expense[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data) {
        return data as Expense[];
      }
    }
    // Fallback to local store
    return localDemoStore.getExpenses().filter((e) => !userId || e.user_id === userId || userId === 'demo-user-777');
  },

  create: async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (!error && data) {
        return data as Expense;
      }
    }
    // Fallback
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
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Expense;
      }
    }
    // Fallback
    const current = localDemoStore.getExpenses();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setExpenses(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Expense not found');
    return result;
  },

  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) return;
    }
    // Fallback
    const current = localDemoStore.getExpenses();
    localDemoStore.setExpenses(current.filter((item) => item.id !== id));
  },
};
