import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { UserProfile, LocaleCode } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { localDemoStore } from '../services/mockData';
import { profileService } from '../services/profileService';
import i18n from '../i18n/i18n';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (
    email: string,
    password?: string,
    name?: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPreferences: (updates: Partial<UserProfile>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Is this a real "the session is gone" error, or just the network hiccuping? Only the
 * former should ever sign the user out — a fetch failure must leave the existing
 * session alone so a flaky connection doesn't cost the user their login. */
const isAuthSessionError = (error: unknown): boolean => {
  const err = error as { status?: number; name?: string } | null;
  if (!err) return false;
  if (err.name === 'AuthApiError' && (err.status === 401 || err.status === 403)) return true;
  if (err.name === 'AuthSessionMissingError') return true;
  return false;
};

/** A hung request (a stalled connection with no server-side timeout to end it) used to
 * leave the app stuck on the full-screen loader forever — `finally { setIsLoading(false) }`
 * only runs once the awaited promise actually settles. Racing it against a timer
 * guarantees bootstrap always finishes one way or another. */
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });

const PROFILE_FETCH_TIMEOUT_MS = 15_000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  // isLoading is ONLY for initial application bootstrap / session check
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Bumped on every sign-out / sign-in so an in-flight profile fetch from a superseded
  // auth state can tell it is stale and must not clobber whatever came after it.
  const authGeneration = useRef(0);

  const applyProfile = (profile: UserProfile, demo: boolean) => {
    setUser(profile);
    setIsDemoMode(demo);
    localDemoStore.setDemoSession(demo);
    if (profile.locale) i18n.changeLanguage(profile.locale);
    // Cached so useCurrency has a same-session-accurate guess for the instant before
    // this profile has loaded on the next reload, instead of always starting at USD.
    if (profile.currency) {
      try {
        localStorage.setItem('pft_currency', profile.currency);
      } catch {
        // best-effort cache only
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // A demo session is a purely local concept — it must never be adjudicated by
        // asking Supabase about it, and must never be cleared just because Supabase
        // (checked afterwards, or from another tab) has no real session of its own.
        if (localDemoStore.isDemoSession()) {
          applyProfile(localDemoStore.getUser(), true);
          return;
        }

        if (isSupabaseConfigured && supabase) {
          // getSession() reads the persisted session from storage — it does not by
          // itself require a network round trip, so a flaky connection at startup
          // cannot look like "no session". The profile fetch below is the network
          // call, and its own failure is handled without touching the session.
          const { data, error } = await supabase.auth.getSession();

          if (error && isAuthSessionError(error)) {
            setUser(null);
            setIsDemoMode(false);
            return;
          }

          const sessionUser = data?.session?.user;
          if (sessionUser) {
            try {
              const profile = await withTimeout(
                profileService.getProfile(sessionUser.id, sessionUser),
                PROFILE_FETCH_TIMEOUT_MS
              );
              applyProfile(profile, false);
            } catch (profileErr) {
              // Session is valid but the profile fetch failed (network, timeout). Do
              // NOT sign the user out for this — build a client-only placeholder from
              // the auth user so the app is usable, and leave the real row untouched.
              console.error('Failed to load profile after session check:', profileErr);
              setUser({
                id: sessionUser.id,
                email: sessionUser.email || '',
                name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User',
                currency: 'USD',
                locale: 'ru',
                theme: 'system',
              });
              setIsDemoMode(false);
            }
            return;
          }

          // No session and no error: the visitor is genuinely signed out.
          setUser(null);
          setIsDemoMode(false);
          return;
        }

        // Supabase not configured fallback
        setUser(null);
        setIsDemoMode(false);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        setIsDemoMode(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        // A demo session lives entirely outside Supabase auth; a stray auth event
        // (e.g. token refresh timer firing with no real session) must not touch it.
        if (localDemoStore.isDemoSession()) return;

        const generation = ++authGeneration.current;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setIsDemoMode(false);
          return;
        }

        const sessionUser = session.user;
        // Fetching the profile is deliberately NOT awaited inline in this callback:
        // supabase-js warns against making other Supabase calls synchronously inside
        // onAuthStateChange (the internal auth lock can deadlock), and doing it as a
        // detached async task also lets a fast subsequent sign-out cancel it below.
        void (async () => {
          try {
            const profile = await profileService.getProfile(sessionUser.id, sessionUser);
            if (authGeneration.current !== generation) return; // superseded — drop it
            applyProfile(profile, false);
          } catch (err) {
            console.error('Failed to load profile on auth state change:', err);
          }
        })();
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password = '') => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      throw new Error(i18n.t('auth.errors.notConfigured'));
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error(i18n.t('auth.errors.signInFailed'));
    }

    authGeneration.current++;
    const profile = await profileService.getProfile(data.user.id, data.user);
    applyProfile(profile, false);
  };

  const signUp = async (email: string, password = '', name = '') => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      throw new Error(i18n.t('auth.errors.notConfigured'));
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: name || normalizedEmail.split('@')[0] },
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error(i18n.t('auth.errors.signUpFailed'));
    }

    // With email confirmation enabled, Supabase returns the user but no session. Signing
    // the visitor in anyway put them inside the app with no JWT, so every read and write
    // was rejected by RLS and the account looked broken and empty. Tell them to confirm
    // instead. (This same response — user present, no session, no error — is also what
    // Supabase returns when the address is already registered and confirmed, as an
    // anti-enumeration measure; the two cases are indistinguishable from the client, so
    // the confirmation screen also offers a "already have an account? Sign in" link.)
    if (!data.session) {
      return { needsEmailConfirmation: true };
    }

    authGeneration.current++;
    const profile = await profileService.getProfile(data.user.id, data.user);
    applyProfile(profile, false);
    return { needsEmailConfirmation: false };
  };

  const signInDemo = async () => {
    authGeneration.current++;
    const demoUser = localDemoStore.getUser();
    // The demo account has no real per-user "saved preference" to restore — its
    // locale is just a hardcoded default in mockData.ts. Blindly restoring it used to
    // snap the interface back to Russian even when the visitor had just switched to
    // another language on this same login screen a moment before clicking the demo
    // button. Respect whatever language is already active instead.
    const profile: UserProfile =
      demoUser.locale === i18n.language ? demoUser : { ...demoUser, locale: i18n.language as LocaleCode };
    if (profile !== demoUser) localDemoStore.setUser(profile);
    applyProfile(profile, true);
  };

  const signOut = async () => {
    authGeneration.current++;
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      localDemoStore.setDemoSession(false);
      setUser(null);
      setIsDemoMode(false);
      // Clean up any remaining localStorage auth keys
      for (const key of Object.keys(localStorage)) {
        if (
          key.startsWith('sb-') ||
          key.startsWith('pft_demo') ||
          key.startsWith('pft_is_demo') ||
          key === 'pft_custom_categories' ||
          key === 'pft_currency'
        ) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(i18n.t('auth.errors.notConfigured'));
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(i18n.t('auth.errors.notConfigured'));
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const updateUserPreferences = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    // Always carry the email along: the profiles row requires it NOT NULL, and if the
    // row does not exist yet an upsert without it would be rejected outright.
    const updated = await profileService.updateProfile(user.id, { email: user.email, ...updates });
    setUser(updated);
    if (updates.locale) {
      i18n.changeLanguage(updates.locale);
      localStorage.setItem('pft_locale', updates.locale);
    }
    if (updates.currency) {
      try {
        localStorage.setItem('pft_currency', updates.currency);
      } catch {
        // best-effort cache only
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isDemoMode,
        signIn,
        signUp,
        signInDemo,
        signOut,
        updateUserPreferences,
        requestPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
