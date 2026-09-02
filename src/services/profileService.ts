import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';
import { UserProfile } from '../types';

export const profileService = {
  getProfile: async (
    userId: string,
    authUser?: { email?: string; user_metadata?: { name?: string; avatar_url?: string } }
  ): Promise<UserProfile> => {
    // Demo user explicitly requested
    if (userId === 'demo-user-777' || !userId) {
      return localDemoStore.getUser();
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          return data as UserProfile;
        }

        // If profile doesn't exist yet in the profiles table, create/upsert it
        const fallbackProfile: UserProfile = {
          id: userId,
          email: authUser?.email || '',
          name: authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User',
          avatar_url: authUser?.user_metadata?.avatar_url || '',
          currency: 'USD',
          locale: 'ru',
          theme: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: upserted, error: upsertError } = await supabase
          .from('profiles')
          .upsert(fallbackProfile)
          .select()
          .single();

        if (!upsertError && upserted) {
          return upserted as UserProfile;
        }

        return fallbackProfile;
      } catch (err) {
        console.error('Error in getProfile:', err);
      }
    }

    // Local fallback for non-Supabase mode
    const localUser = localDemoStore.getUser();
    if (localUser.id === userId) {
      return localUser;
    }

    return {
      id: userId,
      email: authUser?.email || 'user@example.com',
      name: authUser?.user_metadata?.name || 'User',
      currency: 'USD',
      locale: 'ru',
      theme: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<UserProfile> => {
    if (isSupabaseConfigured && supabase && userId !== 'demo-user-777') {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();

      // A failed write used to fall through to the demo store, so the UI reported
      // "Saved" while the account in the database was untouched — and the demo user's
      // record quietly took on a real user's settings. Surface the failure instead.
      if (error) {
        console.error('Failed to update profile in Supabase:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Profile update returned no row');
      }

      return data as UserProfile;
    }

    const current = localDemoStore.getUser();
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() };
    localDemoStore.setUser(updated);
    return updated;
  },
};
