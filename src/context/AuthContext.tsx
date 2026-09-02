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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured && supabase) {
          // Check if there is an active local session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Verify with the Supabase server that the user is still valid and not deleted in DB
            const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();

            if (serverUser && !userError) {
              const profile = await profileService.getProfile(serverUser.id, serverUser);
              setUser(profile);
              setIsDemoMode(false);
              localDemoStore.setDemoSession(false);
              if (profile.locale) i18n.changeLanguage(profile.locale);
              setIsLoading(false);
              return;
            } else {
              // User was deleted from Supabase server or token is invalid
              console.warn('User deleted from Supabase or invalid session. Clearing local session.');
              await supabase.auth.signOut().catch(() => {});
              localDemoStore.setDemoSession(false);
              setUser(null);
              setIsDemoMode(false);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check if demo session was explicitly activated
        if (localDemoStore.isDemoSession()) {
          const demoUser = localDemoStore.getUser();
          setUser(demoUser);
          setIsDemoMode(true);
          if (demoUser.locale) i18n.changeLanguage(demoUser.locale);
        } else {
          setUser(null);
          setIsDemoMode(false);
        }
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
          if (!localDemoStore.isDemoSession()) {
            setUser(null);
            setIsDemoMode(false);
          }
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

  const signIn = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
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

      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          const profile = await profileService.getProfile(data.user.id, data.user);
          setUser(profile);
          setIsDemoMode(false);
          localDemoStore.setDemoSession(false);
        } else {
          throw new Error('Неверный адрес электронной почты или пароль');
        }
      } else {
        // Mock fallback login ONLY if Supabase is not configured
        const mockUser: UserProfile = {
          id: 'user-' + Date.now(),
          email: normalizedEmail,
          name: normalizedEmail.split('@')[0],
          currency: 'USD',
          locale: 'ru',
          theme: 'system',
        };
        localDemoStore.setUser(mockUser);
        localDemoStore.setDemoSession(true);
        setUser(mockUser);
        setIsDemoMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password = 'password123', name = '') => {
    setIsLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (isSupabaseConfigured && supabase) {
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

        if (data.user) {
          const profile = await profileService.getProfile(data.user.id, data.user);
          setUser(profile);
          setIsDemoMode(false);
          localDemoStore.setDemoSession(false);
        } else {
          throw new Error('Не удалось зарегистрировать аккаунт');
        }
      } else {
        const mockUser: UserProfile = {
          id: 'user-' + Date.now(),
          email: normalizedEmail,
          name: name || normalizedEmail.split('@')[0],
          currency: 'USD',
          locale: 'ru',
          theme: 'system',
        };
        localDemoStore.setUser(mockUser);
        localDemoStore.setDemoSession(true);
        setUser(mockUser);
        setIsDemoMode(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInDemo = async () => {
    setIsLoading(true);
    try {
      const demoUser = localDemoStore.getUser();
      localDemoStore.setDemoSession(true);
      setUser(demoUser);
      setIsDemoMode(true);
      if (demoUser.locale) {
        i18n.changeLanguage(demoUser.locale);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
      localDemoStore.setDemoSession(false);
      setUser(null);
      setIsDemoMode(false);
    } finally {
      setIsLoading(false);
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
