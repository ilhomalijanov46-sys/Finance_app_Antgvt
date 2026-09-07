import { Income, Expense, Budget, Goal, UserProfile } from '../types';

export const DEMO_USER: UserProfile = {
  id: 'demo-user-777',
  email: 'alex.mercer@apple.demo',
  name: 'Алекс Мерсер',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  currency: 'USD',
  locale: 'ru',
  theme: 'system',
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
};

const STORAGE_KEYS = {
  USER: 'pft_demo_user',
  INCOMES: 'pft_demo_incomes',
  EXPENSES: 'pft_demo_expenses',
  BUDGETS: 'pft_demo_budgets',
  GOALS: 'pft_demo_goals',
  CATEGORIES: 'pft_custom_categories',
  IS_DEMO: 'pft_is_demo_session',
};


/** JSON round-trip clone: the safe way to hand out a copy of one of the INITIAL_*
 * constants above without letting a caller's later in-place mutation (an update by
 * index, a sort) corrupt the shared module-level array itself. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/** Thrown by demo-mode service methods when a write to localStorage silently failed
 * (quota exceeded, private browsing, blocked storage) — formatDbError recognises this
 * type and shows a translated message instead of the operation reporting success while
 * nothing was actually saved. */
export class LocalStorageWriteError extends Error {
  constructor() {
    super('local storage write failed');
    this.name = 'LocalStorageWriteError';
  }
}

/** Call with the boolean a localDemoStore setter returned; throws if it was `false`. */
export const assertWritten = (ok: boolean): void => {
  if (!ok) throw new LocalStorageWriteError();
};

export const localDemoStore = {
  getUser: (): UserProfile => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : clone(DEMO_USER);
    } catch {
      return clone(DEMO_USER);
    }
  },
  setUser: (user: UserProfile): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  getIncomes: (): Income[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INCOMES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  setIncomes: (incomes: Income[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  getExpenses: (): Expense[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  setExpenses: (expenses: Expense[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  getBudgets: (): Budget[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  setBudgets: (budgets: Budget[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  getGoals: (): Goal[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  setGoals: (goals: Goal[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  getCategories: (): import('../types').CustomCategory[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },
  setCategories: (categories: import('../types').CustomCategory[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  /**
   * Writes any part of the demo dataset that is not in storage yet, loading it on demand
   * so the sample transactions stay out of the main bundle (see demoSeed.ts). Called when
   * a demo session starts or is restored; the synchronous getters above just read
   * localStorage, as they always did.
   */
  ensureSeeded: async (): Promise<void> => {
    try {
      const keys = [
        STORAGE_KEYS.USER,
        STORAGE_KEYS.INCOMES,
        STORAGE_KEYS.EXPENSES,
        STORAGE_KEYS.BUDGETS,
        STORAGE_KEYS.GOALS,
        STORAGE_KEYS.CATEGORIES,
      ];
      if (keys.every((key) => localStorage.getItem(key) !== null)) return;

      const seed = await import('./demoSeed');
      const writeIfAbsent = (key: string, value: unknown) => {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
      };
      writeIfAbsent(STORAGE_KEYS.USER, DEMO_USER);
      writeIfAbsent(STORAGE_KEYS.INCOMES, seed.INITIAL_INCOMES);
      writeIfAbsent(STORAGE_KEYS.EXPENSES, seed.INITIAL_EXPENSES);
      writeIfAbsent(STORAGE_KEYS.BUDGETS, seed.INITIAL_BUDGETS);
      writeIfAbsent(STORAGE_KEYS.GOALS, seed.INITIAL_GOALS);
      writeIfAbsent(STORAGE_KEYS.CATEGORIES, seed.INITIAL_CUSTOM_CATEGORIES);
    } catch (e) {
      // A blocked or full localStorage: the demo opens empty rather than not at all.
      console.error('Failed to seed the demo workspace:', e);
    }
  },
  resetToDefaults: async (): Promise<boolean> => {
    try {
      const seed = await import('./demoSeed');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(seed.INITIAL_INCOMES));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(seed.INITIAL_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(seed.INITIAL_BUDGETS));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(seed.INITIAL_GOALS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(seed.INITIAL_CUSTOM_CATEGORIES));
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  isDemoSession: (): boolean => {
    // Unlike every other method here, this one used to skip the try/catch — and it sits
    // on the hottest path in the app: isDemoContext() calls it, and every single service
    // method calls that. A blocked localStorage (Safari private mode, a strict corporate
    // policy) threw a SecurityError here and took the entire data layer down with it.
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
    } catch {
      return false;
    }
  },
  setDemoSession: (isDemo: boolean): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.IS_DEMO, isDemo ? 'true' : 'false');
    } catch (e) {
      console.error(e);
    }
  },
};
