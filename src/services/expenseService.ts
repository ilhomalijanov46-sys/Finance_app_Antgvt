import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { fetchAllPages } from './pagination';
import { Expense } from '../types';

export const expenseService = {
  getAll: async (userId: string): Promise<Expense[]> => {
    // isDemoContext() is the single source of truth for "which store handles this
    // account" — every method below branches on it (previously create/getAll checked
    // userId === 'demo-user-777' while update/delete checked isDemoContext(), so a
    // stale demo flag could make a real account's edits vanish into localStorage while
    // its reads and creates still hit Supabase).
    if (isDemoContext()) {
      return localDemoStore.getExpenses();
    }

    return fetchAllPages<Expense>('expenses', (from, to) =>
      supabase!
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('time', { ascending: false, nullsFirst: false })
        .range(from, to)
    );
  },

  create: async (expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
        .from('expenses')
        .insert([expense])
        .select()
        .single();

      if (error) {
        console.error('Failed to create expense in Supabase:', error);
        throw error;
      }

      return data as Expense;
    }

    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getExpenses();
    assertWritten(localDemoStore.setExpenses([newExpense, ...current]));
    return newExpense;
  },

  update: async (id: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>): Promise<Expense> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
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
    assertWritten(localDemoStore.setExpenses(updated));
    const result = updated.find((item) => item.id === id);
    if (!result) throw new Error('Expense not found');
    return result;
  },

  /**
   * Moves every row of one category to another in a single statement. The category-delete
   * path used to do this as one update per row: a well-used category meant hundreds of
   * parallel requests, and a failure half-way through left the history partly rewritten
   * with the category itself still in place.
   */
  reassignCategory: async (userId: string, from: string, to: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!
        .from('expenses')
        .update({ category: to })
        .eq('user_id', userId)
        .eq('category', from);

      if (error) {
        console.error('Failed to reassign expense category in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getExpenses();
    assertWritten(
      localDemoStore.setExpenses(
        current.map((item) => (item.category === from ? { ...item, category: to } : item))
      )
    );
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!.from('expenses').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete expense in Supabase:', error);
        throw error;
      }
      return;
    }

    // Demo mode
    const current = localDemoStore.getExpenses();
    assertWritten(localDemoStore.setExpenses(current.filter((item) => item.id !== id)));
  },
};
