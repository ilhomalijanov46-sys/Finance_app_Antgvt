import { supabase, isSupabaseConfigured } from './supabase';
import { localDemoStore } from './mockData';

/**
 * Whether reads and writes must be served by the local demo store instead of
 * Supabase. Update/delete only receive a record id, so without this check they
 * cannot tell a demo record from a real one — and a failed Supabase write would
 * quietly land in localStorage, looking saved while the database never changed.
 */
export const isDemoContext = (): boolean =>
  !isSupabaseConfigured || !supabase || localDemoStore.isDemoSession();
