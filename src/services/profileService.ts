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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        return data as UserProfile;
      }

      // PGRST116 = "The result contains 0 rows": the row genuinely does not exist yet
      // (first sign-in before the handle_new_user trigger's row is visible, or the
      // trigger failed). Any OTHER error — network drop, expired JWT, RLS rejection,
      // timeout — must NOT be treated as "no profile": doing so used to create/upsert
      // a fallback row with hardcoded USD/ru/system, silently overwriting whatever
      // currency/locale/theme the user had actually saved.
      if (error && error.code !== 'PGRST116') {
        console.error('Error in getProfile:', error);
        throw error;
      }

      // Row genuinely missing — create it.
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

      if (upsertError) {
        console.error('Failed to create profile row:', upsertError);
      }

      return fallbackProfile;
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
