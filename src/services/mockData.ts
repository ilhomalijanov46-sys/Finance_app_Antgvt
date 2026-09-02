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

export const localDemoStore = {
  getUser: (): UserProfile => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : DEMO_USER;
    } catch {
      return DEMO_USER;
    }
  },
  setUser: (user: UserProfile): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }
  },
  getIncomes: (): Income[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.INCOMES);
      return stored ? JSON.parse(stored) : INITIAL_INCOMES;
    } catch {
      return INITIAL_INCOMES;
    }
  },
  setIncomes: (incomes: Income[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(incomes));
    } catch (e) {
      console.error(e);
    }
  },
  getExpenses: (): Expense[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      return stored ? JSON.parse(stored) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  },
  setExpenses: (expenses: Expense[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
    } catch (e) {
      console.error(e);
    }
  },
  getBudgets: (): Budget[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
      return stored ? JSON.parse(stored) : INITIAL_BUDGETS;
    } catch {
      return INITIAL_BUDGETS;
    }
  },
  setBudgets: (budgets: Budget[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error(e);
    }
  },
  getGoals: (): Goal[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
      return stored ? JSON.parse(stored) : INITIAL_GOALS;
    } catch {
      return INITIAL_GOALS;
    }
  },
  setGoals: (goals: Goal[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  },
  getCategories: (): import('../types').CustomCategory[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return stored ? JSON.parse(stored) : INITIAL_CUSTOM_CATEGORIES;
    } catch {
      return INITIAL_CUSTOM_CATEGORIES;
    }
  },
  setCategories: (categories: import('../types').CustomCategory[]): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  },
  resetToDefaults: (): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(DEMO_USER));
      localStorage.setItem(STORAGE_KEYS.INCOMES, JSON.stringify(INITIAL_INCOMES));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(INITIAL_BUDGETS));
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(INITIAL_GOALS));
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CUSTOM_CATEGORIES));
    } catch (e) {
      console.error(e);
    }
  },
  isDemoSession: (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO) === 'true';
  },
  setDemoSession: (isDemo: boolean): void => {
    localStorage.setItem(STORAGE_KEYS.IS_DEMO, isDemo ? 'true' : 'false');
  },
};
