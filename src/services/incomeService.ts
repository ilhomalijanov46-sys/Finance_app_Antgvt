import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { Income } from '../types';

export const incomeService = {
  getAll: async (userId: string): Promise<Income[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data) {
        return data as Income[];
      }
    }
    // Fallback to local store
    return localDemoStore.getIncomes().filter((i) => !userId || i.user_id === userId || userId === 'demo-user-777');
  },

  create: async (income: Omit<Income, 'id' | 'created_at'>): Promise<Income> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incomes')
        .insert([income])
        .select()
        .single();

      if (!error && data) {
        return data as Income;
      }
    }
    // Fallback
    const newIncome: Income = {
      ...income,
      id: 'inc-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getIncomes();
    localDemoStore.setIncomes([newIncome, ...current]);
    return newIncome;
  },

  update: async (id: string, updates: Partial<Omit<Income, 'id' | 'user_id' | 'created_at'>>): Promise<Income> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data as Income;
      }
    }
    // Fallback
    const current = localDemoStore.getIncomes();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setIncomes(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Income not found');
    return result;
  },

  delete: async (id: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      if (!error) return;
    }
    // Fallback
    const current = localDemoStore.getIncomes();
    localDemoStore.setIncomes(current.filter((item) => item.id !== id));
  },
};
