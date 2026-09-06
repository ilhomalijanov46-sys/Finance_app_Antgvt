import { Income, Expense, Budget, Goal, UserProfile } from '../types';
import { toDateKey } from '../utils/formatters';

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

const getRelativeDate = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return toDateKey(d);
};

export const INITIAL_INCOMES: Income[] = [
  {
    id: 'inc-1',
    user_id: 'demo-user-777',
    amount: 5200,
    category: 'salary',
    source: 'TechCorp HQ',
    note: 'Ежемесячный оклад (Senior Product Designer)',
    date: getRelativeDate(2),
    created_at: new Date().toISOString(),
  },
  {
    id: 'inc-2',
    user_id: 'demo-user-777',
    amount: 1450,
    category: 'freelance',
    source: 'Студия Minimal',
    note: 'Консалтинг по дизайн-системе и аудит',
    date: getRelativeDate(12),
    created_at: new Date().toISOString(),
  },
  {
    id: 'inc-3',
    user_id: 'demo-user-777',
    amount: 380,
    category: 'investments',
    source: 'Vanguard Index Fund',
    note: 'Квартальные дивиденды по акциям',
    date: getRelativeDate(18),
    created_at: new Date().toISOString(),
  },
  {
    id: 'inc-4',
    user_id: 'demo-user-777',
    amount: 800,
    category: 'bonus',
    source: 'TechCorp HQ',
    note: 'Премия за инновационный проект Q3',
    date: getRelativeDate(28),
    created_at: new Date().toISOString(),
  },
  {
    id: 'inc-5',
    user_id: 'demo-user-777',
    amount: 5200,
    category: 'salary',
    source: 'TechCorp HQ',
    note: 'Оклад за предыдущий месяц',
    date: getRelativeDate(32),
    created_at: new Date().toISOString(),
  },
  {
    id: 'inc-6',
    user_id: 'demo-user-777',
    amount: 1200,
    category: 'freelance',
    source: 'Fintech Проект',
    note: 'Дизайн спринт мобильного приложения',
    date: getRelativeDate(45),
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    user_id: 'demo-user-777',
    amount: 145,
    category: 'groceries',
    payment_method: 'card',
    note: 'Продукты на неделю и супермаркет',
    date: getRelativeDate(0),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    user_id: 'demo-user-777',
    amount: 42.5,
    category: 'dining',
    payment_method: 'card',
    note: 'Кофе и ланч с коллегами',
    date: getRelativeDate(1),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    user_id: 'demo-user-777',
    amount: 18.2,
    category: 'taxi',
    payment_method: 'card',
    note: 'Поездка в офис и деловая встреча',
    date: getRelativeDate(2),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-4',
    user_id: 'demo-user-777',
    amount: 1650,
    category: 'rent',
    payment_method: 'transfer',
    note: 'Аренда квартиры и паркинг',
    date: getRelativeDate(3),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-5',
    user_id: 'demo-user-777',
    amount: 85,
    category: 'internet',
    payment_method: 'card',
    note: 'Оптоволоконный гигабитный интернет',
    date: getRelativeDate(5),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-6',
    user_id: 'demo-user-777',
    amount: 45,
    category: 'mobile',
    payment_method: 'card',
    note: 'Безлимитный тариф связи 5G',
    date: getRelativeDate(6),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-7',
    user_id: 'demo-user-777',
    amount: 14.99,
    category: 'subscriptions',
    payment_method: 'card',
    note: 'Подписка Apple One Premier',
    date: getRelativeDate(7),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-8',
    user_id: 'demo-user-777',
    amount: 19.99,
    category: 'subscriptions',
    payment_method: 'card',
    note: 'Подписка Netflix Ultra 4K',
    date: getRelativeDate(8),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-9',
    user_id: 'demo-user-777',
    amount: 210,
    category: 'clothing',
    payment_method: 'card',
    note: 'Шерстяной свитер и обувь',
    date: getRelativeDate(10),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-10',
    user_id: 'demo-user-777',
    amount: 120,
    category: 'utilities',
    payment_method: 'card',
    note: 'Электричество, вода и коммунальные услуги',
    date: getRelativeDate(14),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-11',
    user_id: 'demo-user-777',
    amount: 65,
    category: 'health',
    payment_method: 'card',
    note: 'Витаминный комплекс и аптека',
    date: getRelativeDate(16),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-12',
    user_id: 'demo-user-777',
    amount: 180,
    category: 'groceries',
    payment_method: 'card',
    note: 'Семейные закупки в гипермаркете',
    date: getRelativeDate(20),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-13',
    user_id: 'demo-user-777',
    amount: 88,
    category: 'dining',
    payment_method: 'card',
    note: 'Ужин в ресторане',
    date: getRelativeDate(22),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-14',
    user_id: 'demo-user-777',
    amount: 45,
    category: 'transport',
    payment_method: 'card',
    note: 'Пополнение транспортной карты',
    date: getRelativeDate(25),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-15',
    user_id: 'demo-user-777',
    amount: 1650,
    category: 'rent',
    payment_method: 'transfer',
    note: 'Аренда за прошлый месяц',
    date: getRelativeDate(33),
    created_at: new Date().toISOString(),
  },
  {
    id: 'exp-16',
    user_id: 'demo-user-777',
    amount: 320,
    category: 'groceries',
    payment_method: 'card',
    note: 'Итоговые закупки продуктов',
    date: getRelativeDate(36),
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bud-1',
    user_id: 'demo-user-777',
    category: 'groceries',
    limit_amount: 550,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bud-2',
    user_id: 'demo-user-777',
    category: 'dining',
    limit_amount: 300,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bud-3',
    user_id: 'demo-user-777',
    category: 'rent',
    limit_amount: 1700,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bud-4',
    user_id: 'demo-user-777',
    category: 'subscriptions',
    limit_amount: 80,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bud-5',
    user_id: 'demo-user-777',
    category: 'transport',
    limit_amount: 150,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
  {
    id: 'bud-6',
    user_id: 'demo-user-777',
    category: 'clothing',
    limit_amount: 350,
    period: 'monthly',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_GOALS: Goal[] = [
  {
    id: 'goal-1',
    user_id: 'demo-user-777',
    title: 'MacBook Pro 16" M3 Max',
    target_amount: 3500,
    current_amount: 2800,
    deadline: getRelativeDate(-45),
    color: '#0071e3',
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-2',
    user_id: 'demo-user-777',
    title: 'Путешествие в Токио 2027',
    target_amount: 4500,
    current_amount: 2100,
    deadline: getRelativeDate(-120),
    color: '#10b981',
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-3',
    user_id: 'demo-user-777',
    title: 'Резервный фонд (6 месяцев)',
    target_amount: 15000,
    current_amount: 12500,
    deadline: getRelativeDate(-180),
    color: '#8b5cf6',
    created_at: new Date().toISOString(),
  },
  {
    id: 'goal-4',
    user_id: 'demo-user-777',
    title: 'Apple Vision Pro',
    target_amount: 3800,
    current_amount: 3800,
    deadline: getRelativeDate(5),
    color: '#f59e0b',
    created_at: new Date().toISOString(),
  },
];

const STORAGE_KEYS = {
  USER: 'pft_demo_user',
  INCOMES: 'pft_demo_incomes',
  EXPENSES: 'pft_demo_expenses',
  BUDGETS: 'pft_demo_budgets',
  GOALS: 'pft_demo_goals',
  CATEGORIES: 'pft_custom_categories',
  IS_DEMO: 'pft_is_demo_session',
};

export const INITIAL_CUSTOM_CATEGORIES: import('../types').CustomCategory[] = [
  { id: 'cat-custom-1', name: 'Криптовалюта', type: 'income', color: '#f59e0b' },
  { id: 'cat-custom-2', name: 'Курсы и Обучение', type: 'expense', color: '#8b5cf6' },
  { id: 'cat-custom-3', name: 'Спорт и Фитнес', type: 'expense', color: '#06b6d4' },
];

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
      return stored ? JSON.parse(stored) : clone(INITIAL_INCOMES);
    } catch {
      return clone(INITIAL_INCOMES);
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
      return stored ? JSON.parse(stored) : clone(INITIAL_EXPENSES);
    } catch {
      return clone(INITIAL_EXPENSES);
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
      return stored ? JSON.parse(stored) : clone(INITIAL_BUDGETS);
    } catch {
      return clone(INITIAL_BUDGETS);
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
      return stored ? JSON.parse(stored) : clone(INITIAL_GOALS);
    } catch {
      return clone(INITIAL_GOALS);
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
      return stored ? JSON.parse(stored) : clone(INITIAL_CUSTOM_CATEGORIES);
    } catch {
      return clone(INITIAL_CUSTOM_CATEGORIES);
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
  resetToDefaults: (): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CUSTOM_CATEGORIES));
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
