import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore, DEMO_USER } from './mockData';
import { UserProfile } from '../types';

export const profileService = {
  getProfile: async (userId: string): Promise<UserProfile> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return data as UserProfile;
      }
    }
    return localDemoStore.getUser();
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        return data as UserProfile;
      }
    }
    const current = localDemoStore.getUser();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    localDemoStore.setUser(updated);
    return updated;
  },

  resetDemoData: async (): Promise<void> => {
    localDemoStore.resetToDefaults();
  },

  getDefaultDemoUser: (): UserProfile => {
    return DEMO_USER;
  },
};
