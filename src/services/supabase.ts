import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasUrl = Boolean(
  supabaseUrl && supabaseUrl !== 'https://your-project-id.supabase.co' && !supabaseUrl.includes('placeholder')
);
const hasKey = Boolean(supabaseAnonKey && supabaseAnonKey !== 'your-supabase-anon-key');

export const isSupabaseConfigured = hasUrl && hasKey;

// Only one of the two set is almost certainly a mistake (an incomplete .env, a typo in
// one variable's name) rather than the intentional "run in local demo mode" choice —
// that's when neither is set. Silently falling back to demo mode either way used to
// give no hint at all that something was half-configured.
if (hasUrl !== hasKey) {
  console.warn(
    `Supabase is only partially configured (${hasUrl ? 'VITE_SUPABASE_URL is set, VITE_SUPABASE_ANON_KEY is missing' : 'VITE_SUPABASE_ANON_KEY is set, VITE_SUPABASE_URL is missing'}). Falling back to local demo mode — check your .env file.`
  );
}

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    // createClient throws synchronously on a malformed URL — at *module import* time,
    // which used to crash the entire app before React ever got to render anything.
    // Falling back to demo mode is a better failure than a white screen.
    console.error('Failed to initialize Supabase client — falling back to local demo mode:', err);
    client = null;
  }
}

export const supabase = client;
