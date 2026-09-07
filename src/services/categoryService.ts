import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { fetchAllPages } from './pagination';
import { CustomCategory } from '../types';

/**
 * Custom categories for a signed-in account live in Supabase; the demo workspace keeps
 * using the local store. Before this service they were always local, so one browser
 * shared a single list across every account that signed in on it.
 */
export const categoryService = {
  getAll: async (userId: string): Promise<CustomCategory[]> => {
    if (isDemoContext()) {
      return localDemoStore.getCategories();
    }

    return fetchAllPages<CustomCategory>('custom_categories', (from, to) =>
      supabase!
        .from('custom_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range(from, to)
    );
  },

  create: async (category: Omit<CustomCategory, 'id' | 'created_at'>): Promise<CustomCategory> => {
    if (!isDemoContext()) {
      const { data, error } = await supabase!
        .from('custom_categories')
        .insert([category])
        .select()
        .single();

      if (error) {
        console.error('Failed to create custom category in Supabase:', error);
        throw error;
      }

      return data as CustomCategory;
    }

    const newCategory: CustomCategory = {
      ...category,
      id: 'cat-custom-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    assertWritten(localDemoStore.setCategories([...localDemoStore.getCategories(), newCategory]));
    return newCategory;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext()) {
      const { error } = await supabase!.from('custom_categories').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete custom category in Supabase:', error);
        throw error;
      }
      return;
    }

    assertWritten(
      localDemoStore.setCategories(localDemoStore.getCategories().filter((c) => c.id !== id))
    );
  },
};
