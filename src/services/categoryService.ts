import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { CustomCategory } from '../types';

/**
 * Custom categories for a signed-in account live in Supabase; the demo workspace keeps
 * using the local store. Before this service they were always local, so one browser
 * shared a single list across every account that signed in on it.
 */
export const categoryService = {
  getAll: async (userId: string): Promise<CustomCategory[]> => {
    if (userId === 'demo-user-777' || isDemoContext() || !isSupabaseConfigured || !supabase) {
      return localDemoStore.getCategories();
    }

    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch custom categories from Supabase:', error);
      throw error;
    }

    return (data as CustomCategory[]) || [];
  },

  create: async (category: Omit<CustomCategory, 'id' | 'created_at'>): Promise<CustomCategory> => {
    if (!isDemoContext() && supabase && category.user_id && category.user_id !== 'demo-user-777') {
      const { data, error } = await supabase
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
      id: 'cat-custom-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    localDemoStore.setCategories([...localDemoStore.getCategories(), newCategory]);
    return newCategory;
  },

  delete: async (id: string): Promise<void> => {
    if (!isDemoContext() && supabase && !id.startsWith('cat-custom-')) {
      const { error } = await supabase.from('custom_categories').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete custom category in Supabase:', error);
        throw error;
      }
      return;
    }

    localDemoStore.setCategories(localDemoStore.getCategories().filter((c) => c.id !== id));
  },
};
