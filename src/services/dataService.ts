import { supabase } from './supabase';
import { localDemoStore } from './mockData';
import { isDemoContext } from './demoMode';
import { Income, Expense, Budget, Goal, PaymentMethod } from '../types';

export interface BackupPayload {
  incomes?: unknown[];
  expenses?: unknown[];
  budgets?: unknown[];
  goals?: unknown[];
}

export interface ImportResult {
  imported: number;
  total: number;
}

const asNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const asDateKey = (value: unknown): string => {
  const text = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : new Date().toISOString().slice(0, 10);
};

const asPaymentMethod = (value: unknown): PaymentMethod =>
  value === 'cash' || value === 'transfer' ? value : 'card';

/**
 * A backup file carries the ids it was exported with. Those either collide with rows
 * already in the account or — for a demo export — are not UUIDs at all, so the insert
 * would be rejected. Import always creates fresh rows owned by the current user.
 */
const toIncomeRow = (raw: Record<string, unknown>, userId: string) => ({
  user_id: userId,
  amount: asNumber(raw.amount),
  category: String(raw.category || 'other'),
  payment_method: asPaymentMethod(raw.payment_method),
  source: raw.source ? String(raw.source) : null,
  note: raw.note ? String(raw.note) : null,
  date: asDateKey(raw.date),
  time: raw.time ? String(raw.time) : null,
});

const toExpenseRow = (raw: Record<string, unknown>, userId: string) => ({
  user_id: userId,
  amount: asNumber(raw.amount),
  category: String(raw.category || 'miscellaneous'),
  payment_method: asPaymentMethod(raw.payment_method),
  note: raw.note ? String(raw.note) : null,
  date: asDateKey(raw.date),
  time: raw.time ? String(raw.time) : null,
});

const toBudgetRow = (raw: Record<string, unknown>, userId: string) => ({
  user_id: userId,
  category: String(raw.category || 'miscellaneous'),
  limit_amount: asNumber(raw.limit_amount),
  period:
    raw.period === 'weekly' || raw.period === 'yearly' ? (raw.period as string) : 'monthly',
});

const toGoalRow = (raw: Record<string, unknown>, userId: string) => ({
  user_id: userId,
  title: String(raw.title || 'Goal'),
  target_amount: asNumber(raw.target_amount),
  current_amount: Math.max(0, asNumber(raw.current_amount)),
  deadline: raw.deadline ? asDateKey(raw.deadline) : null,
  color: raw.color ? String(raw.color) : '#0071e3',
});

const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

export const dataService = {
  /**
   * Restores a backup. In the demo workspace this replaces the local store, exactly as
   * before. For a signed-in account it inserts the records into Supabase — which is what
   * the button always claimed to do, while in fact it only ever wrote to localStorage
   * and left the database untouched.
   */
  importBackup: async (payload: BackupPayload, userId: string): Promise<ImportResult> => {
    const incomes = rows(payload.incomes);
    const expenses = rows(payload.expenses);
    const budgets = rows(payload.budgets);
    const goals = rows(payload.goals);
    const total = incomes.length + expenses.length + budgets.length + goals.length;

    if (isDemoContext() || !supabase || userId === 'demo-user-777') {
      if (Array.isArray(payload.incomes)) localDemoStore.setIncomes(payload.incomes as Income[]);
      if (Array.isArray(payload.expenses)) localDemoStore.setExpenses(payload.expenses as Expense[]);
      if (Array.isArray(payload.budgets)) localDemoStore.setBudgets(payload.budgets as Budget[]);
      if (Array.isArray(payload.goals)) localDemoStore.setGoals(payload.goals as Goal[]);
      return { imported: total, total };
    }

    let imported = 0;
    const insert = async (
      table: string,
      values: Record<string, unknown>[],
      failuresAllowed = true
    ) => {
      if (values.length === 0) return;
      const { error } = await supabase!.from(table).insert(values);
      if (error) {
        console.error(`Failed to import ${table}:`, error);
        if (!failuresAllowed) throw error;
        return;
      }
      imported += values.length;
    };

    await insert('incomes', incomes.map((r) => toIncomeRow(r, userId)));
    await insert('expenses', expenses.map((r) => toExpenseRow(r, userId)));
    // Budgets carry a UNIQUE(user_id, category), so an existing category must be updated
    // rather than duplicated.
    if (budgets.length > 0) {
      const { error } = await supabase
        .from('budgets')
        .upsert(budgets.map((r) => toBudgetRow(r, userId)), { onConflict: 'user_id,category' });
      if (error) console.error('Failed to import budgets:', error);
      else imported += budgets.length;
    }
    await insert('goals', goals.map((r) => toGoalRow(r, userId)));

    if (imported === 0 && total > 0) {
      throw new Error('Import failed: no records were written');
    }

    return { imported, total };
  },

  /**
   * Demo workspace: restore the seeded sample data. Signed-in account: delete everything
   * the account owns. The old implementation always did the former, so for a real user
   * the button reported success while changing nothing.
   */
  resetAll: async (userId: string): Promise<void> => {
    if (isDemoContext() || !supabase || userId === 'demo-user-777') {
      localDemoStore.resetToDefaults();
      return;
    }

    for (const table of ['incomes', 'expenses', 'budgets', 'goals', 'custom_categories']) {
      const { error } = await supabase.from(table).delete().eq('user_id', userId);
      // custom_categories may not exist yet if migration 003 has not been applied; that
      // must not abort the rest of the reset.
      if (error && table !== 'custom_categories') {
        console.error(`Failed to clear ${table}:`, error);
        throw error;
      }
    }
  },
};
