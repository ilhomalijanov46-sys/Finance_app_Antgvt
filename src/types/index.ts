export type CurrencyCode = 'USD' | 'UZS' | 'EUR' | 'RUB';
export type LocaleCode = 'ru' | 'en' | 'uz';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  currency: CurrencyCode;
  locale: LocaleCode;
  theme: ThemeMode;
  created_at?: string;
  updated_at?: string;
}

export type DefaultIncomeCategory =
  | 'salary'
  | 'advance'
  | 'bonus'
  | 'freelance'
  | 'sale'
  | 'gift'
  | 'investments'
  | 'other';

export type IncomeCategory = DefaultIncomeCategory | string;

export type PaymentMethod = 'card' | 'cash' | 'transfer';

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  category: IncomeCategory;
  payment_method?: PaymentMethod;
  source?: string;
  note?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  created_at?: string;
}

export type DefaultExpenseCategory =
  | 'groceries'
  | 'dining'
  | 'transport'
  | 'taxi'
  | 'internet'
  | 'mobile'
  | 'utilities'
  | 'rent'
  | 'loans'
  | 'subscriptions'
  | 'entertainment'
  | 'clothing'
  | 'health'
  | 'home'
  | 'travel'
  | 'pets'
  | 'miscellaneous';

export type ExpenseCategory = DefaultExpenseCategory | string;

export interface CustomCategory {
  id: string;
  user_id?: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  note?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  created_at?: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  limit_amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string; // YYYY-MM-DD
  color: string;
  created_at?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  activeGoalsCount: number;
  budgetUsagePercent: number;
}

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  count: number;
  color?: string;
}

export interface MonthlyTrend {
  month: string; // e.g. "2024-01" or "Jan"
  income: number;
  expense: number;
  savings: number;
}

export interface CalendarDayData {
  date: string; // YYYY-MM-DD
  incomes: Income[];
  expenses: Expense[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  hasSubscription?: boolean;
}
