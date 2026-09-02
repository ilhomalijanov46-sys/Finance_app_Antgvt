import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { Income } from '../types';

export const incomeService = {
  getAll: async (userId: string): Promise<Income[]> => {
    // If Demo user mode
    if (userId === 'demo-user-777' || !isSupabaseConfigured || !supabase) {
      return localDemoStore.getIncomes();
    }

    // Real Supabase user
    const { data, error } = await supabase
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Failed to fetch incomes from Supabase:', error);
      return [];
    }

    return (data as Income[]) || [];
  },

  create: async (income: Omit<Income, 'id' | 'created_at'>): Promise<Income> => {
    if (isSupabaseConfigured && supabase && income.user_id !== 'demo-user-777') {
      const { data, error } = await supabase
        .from('incomes')
        .insert([income])
        .select()
        .single();

      if (error) {
        console.error('Failed to create income in Supabase:', error);
        throw error;
      }

      if (data) {
        return data as Income;
      }
    }

    // Fallback for Demo mode
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
    if (!isDemoContext() && supabase) {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update income in Supabase:', error);
        throw error;
      }

      if (!data) throw new Error('Income not found');
      return data as Income;
    }

    // Demo mode
    const current = localDemoStore.getIncomes();
    const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
    localDemoStore.setIncomes(updated);
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Income not found');
    return result;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext() && supabase) {
      const { error } = await supabase.from('incomes').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete income in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getIncomes();
    localDemoStore.setIncomes(current.filter((item) => item.id !== id));
  },
};
