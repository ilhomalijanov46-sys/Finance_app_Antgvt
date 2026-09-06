import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { Income } from '../types';

export const incomeService = {
  getAll: async (userId: string): Promise<Income[]> => {
    // isDemoContext() is the single source of truth for "which store handles this
    // account" — every method below branches on it (previously create/getAll checked
    // userId === 'demo-user-777' while update/delete checked isDemoContext(), so a
    // stale demo flag could make a real account's edits vanish into localStorage while
    // its reads and creates still hit Supabase).
    if (isDemoContext()) {
      return localDemoStore.getIncomes();
    }

    const { data, error } = await supabase!
      .from('incomes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('time', { ascending: false, nullsFirst: false });

    if (error) {
      // Rethrow: a failed read must reach the UI as an error, not as "no records".
      console.error('Failed to fetch incomes from Supabase:', error);
      throw error;
    }

    return (data as Income[]) || [];
  },

  create: async (income: Omit<Income, 'id' | 'created_at'>): Promise<Income> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
        .from('incomes')
        .insert([income])
        .select()
        .single();

      if (error) {
        console.error('Failed to create income in Supabase:', error);
        throw error;
      }

      return data as Income;
    }

    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getIncomes();
    assertWritten(localDemoStore.setIncomes([newIncome, ...current]));
    return newIncome;
  },

  update: async (id: string, updates: Partial<Omit<Income, 'id' | 'user_id' | 'created_at'>>): Promise<Income> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
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
    assertWritten(localDemoStore.setIncomes(updated));
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Income not found');
    return result;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!.from('incomes').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete income in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getIncomes();
    assertWritten(localDemoStore.setIncomes(current.filter((item) => item.id !== id)));
  },
};
