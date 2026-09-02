import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { localDemoStore } from '../services/mockData';
import { profileService } from '../services/profileService';
import i18n from '../i18n/i18n';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password?: string, name?: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserPreferences: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  // isLoading is ONLY for initial application bootstrap / session check
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          // Verify with the Supabase server that user is active and exists
          const { data, error } = await supabase.auth.getUser();

          if (data?.user && !error) {
            const profile = await profileService.getProfile(data.user.id, data.user);
            setUser(profile);
            setIsDemoMode(false);
            localDemoStore.setDemoSession(false);
            if (profile.locale) i18n.changeLanguage(profile.locale);
            return;
          } else {
            // User does not exist, was deleted from Supabase, or no session exists
            await supabase.auth.signOut().catch(() => {});
            localDemoStore.setDemoSession(false);
            setUser(null);
            setIsDemoMode(false);
            return;
          }
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setIsDemoMode(false);
        } else if (session?.user) {
          const profile = await profileService.getProfile(session.user.id, session.user);
          setUser(profile);
          setIsDemoMode(false);
          localDemoStore.setDemoSession(false);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password = '') => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user wants to log into the Demo account
    if (
      normalizedEmail === 'demo@example.com' ||
      normalizedEmail === 'alex.mercer@apple.demo' ||
      normalizedEmail === 'demo@demo.com' ||
      normalizedEmail === 'demo@finance.app'
    ) {
      const demoUser = localDemoStore.getUser();
      localDemoStore.setDemoSession(true);
      setUser(demoUser);
      setIsDemoMode(true);
      if (demoUser.locale) {
        i18n.changeLanguage(demoUser.locale);
      }
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('База данных не настроена');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (!data?.user) {
      throw new Error('Пользователь не найден или введен неверный пароль');
    }

    const profile = await profileService.getProfile(data.user.id, data.user);
    setUser(profile);
    setIsDemoMode(false);
    localDemoStore.setDemoSession(false);
  };

  const signUp = async (email: string, password = '', name = '') => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      throw new Error('База данных не настроена');
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
      throw new Error('Не удалось зарегистрировать пользователя');
    }

    const profile = await profileService.getProfile(data.user.id, data.user);
    setUser(profile);
    setIsDemoMode(false);
    localDemoStore.setDemoSession(false);
  };

  const signInDemo = async () => {
    const demoUser = localDemoStore.getUser();
    localDemoStore.setDemoSession(true);
    setUser(demoUser);
    setIsDemoMode(true);
    if (demoUser.locale) {
      i18n.changeLanguage(demoUser.locale);
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      localDemoStore.setDemoSession(false);
      setUser(null);
      setIsDemoMode(false);
      // Clean up any remaining localStorage auth keys
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') || key.startsWith('pft_demo') || key === 'pft_is_demo') {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const updateUserPreferences = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = await profileService.updateProfile(user.id, updates);
    setUser(updated);
    if (updates.locale) {
      i18n.changeLanguage(updates.locale);
      localStorage.setItem('pft_locale', updates.locale);
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
