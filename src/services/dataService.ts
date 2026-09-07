import { supabase } from './supabase';
import { localDemoStore, assertWritten } from './mockData';
import { isDemoContext } from './demoMode';
import { incomeService } from './incomeService';
import { expenseService } from './expenseService';
import { goalService } from './goalService';
import { categoryService } from './categoryService';
import { Income, Expense, Goal, PaymentMethod, CustomCategory } from '../types';

export interface BackupPayload {
  incomes?: unknown[];
  expenses?: unknown[];
  budgets?: unknown[];
  goals?: unknown[];
  customCategories?: unknown[];
}

export interface ImportResult {
  imported: number;
  total: number;
  /** Rows that were syntactically present but rejected by validation (bad amount,
   * impossible date, …) — reported so "imported < total" isn't a mystery. */
  skippedInvalid: number;
  /** Rows that matched a record already in the account (or a repeat within the same
   * file) and were left alone rather than inserted a second time. */
  skippedDuplicate: number;
}

const asNumber = (value: unknown): number => Number(value);

// Rejects both malformed strings AND impossible-but-well-formed ones like
// "2026-02-30": constructing the Date and reading its fields back catches the day
// overflowing into the next month, which the regex alone cannot.
const isValidDateKey = (value: unknown): value is string => {
  const text = String(value ?? '');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

const asPaymentMethod = (value: unknown): PaymentMethod =>
  value === 'cash' || value === 'transfer' ? value : 'card';

const round2 = (n: number): string => n.toFixed(2);

// Fingerprints identify "the same transaction" across a re-import of the same backup
// (or two backups covering an overlapping period) so importing twice does not double
// every amount on the books.
const incomeFingerprint = (r: { date: string; time?: string | null; amount: number; category: string; note?: string | null }) =>
  `${r.date}|${r.time || ''}|${round2(Number(r.amount))}|${r.category}|${(r.note || '').trim()}`;

const expenseFingerprint = incomeFingerprint;

const goalFingerprint = (r: { title: string; target_amount: number; deadline?: string | null }) =>
  `${r.title.trim().toLowerCase()}|${round2(Number(r.target_amount))}|${r.deadline || ''}`;

const categoryFingerprint = (r: { type: string; name: string }) =>
  `${r.type}|${r.name.trim().toLowerCase()}`;

/**
 * A backup file carries the ids it was exported with. Those either collide with rows
 * already in the account or — for a demo export — are not UUIDs at all, so the insert
 * would be rejected. Import always creates fresh rows owned by the current user.
 * Returns null for a row that fails basic validation (non-positive amount, impossible
 * date) instead of silently coercing it to 0 or today, which used to make one bad line
 * in a 500-row file either poison the whole batch (a single bad row makes Postgres
 * reject the entire insert) or quietly corrupt the user's history.
 */
const toIncomeRow = (raw: Record<string, unknown>, userId: string) => {
  const amount = asNumber(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!isValidDateKey(raw.date)) return null;
  return {
    user_id: userId,
    amount,
    category: String(raw.category || 'other'),
    payment_method: asPaymentMethod(raw.payment_method),
    source: raw.source ? String(raw.source) : null,
    note: raw.note ? String(raw.note) : null,
    date: String(raw.date),
    time: raw.time ? String(raw.time) : null,
  };
};

const toExpenseRow = (raw: Record<string, unknown>, userId: string) => {
  const amount = asNumber(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!isValidDateKey(raw.date)) return null;
  return {
    user_id: userId,
    amount,
    category: String(raw.category || 'miscellaneous'),
    payment_method: asPaymentMethod(raw.payment_method),
    note: raw.note ? String(raw.note) : null,
    date: String(raw.date),
    time: raw.time ? String(raw.time) : null,
  };
};

const toBudgetRow = (raw: Record<string, unknown>, userId: string) => {
  const limit_amount = asNumber(raw.limit_amount);
  if (!Number.isFinite(limit_amount) || limit_amount <= 0) return null;
  const category = String(raw.category || '').trim();
  if (!category) return null;
  const period = (raw.period === 'weekly' || raw.period === 'yearly' ? raw.period : 'monthly') as
    | 'monthly'
    | 'weekly'
    | 'yearly';
  return {
    user_id: userId,
    category,
    limit_amount,
    period,
  };
};

const toGoalRow = (raw: Record<string, unknown>, userId: string) => {
  const target_amount = asNumber(raw.target_amount);
  if (!Number.isFinite(target_amount) || target_amount <= 0) return null;
  const title = String(raw.title || '').trim();
  if (!title) return null;
  const rawCurrent = asNumber(raw.current_amount);
  const current_amount = Math.max(0, Math.min(target_amount, Number.isFinite(rawCurrent) ? rawCurrent : 0));
  const deadline = raw.deadline && isValidDateKey(raw.deadline) ? String(raw.deadline) : null;
  return {
    user_id: userId,
    title,
    target_amount,
    current_amount,
    deadline,
    color: raw.color ? String(raw.color) : '#0071e3',
  };
};

const toCategoryRow = (raw: Record<string, unknown>, userId: string) => {
  const name = String(raw.name || '').trim();
  if (!name) return null;
  const type = raw.type === 'income' || raw.type === 'expense' ? raw.type : null;
  if (!type) return null;
  return {
    user_id: userId,
    name,
    type,
    color: raw.color ? String(raw.color) : null,
    icon: raw.icon ? String(raw.icon) : null,
  };
};

const rows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

const CHUNK_SIZE = 500;

/** Inserts in chunks so one request rejected by the database (a constraint neither
 * validated above nor expected) fails only that chunk, not the whole import. */
async function insertChunked(
  table: string,
  values: Record<string, unknown>[]
): Promise<{ inserted: number; failed: number }> {
  let inserted = 0;
  let failed = 0;
  for (let i = 0; i < values.length; i += CHUNK_SIZE) {
    const chunk = values.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase!.from(table).insert(chunk);
    if (error) {
      console.error(`Failed to import a chunk of ${table}:`, error);
      failed += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }
  return { inserted, failed };
}

export const dataService = {
  /**
   * Restores a backup — the same merge semantics for a demo workspace and a signed-in
   * account (previously the demo path replaced the whole local store while a real
   * account's import only ever added rows; that inconsistency, on top of writing to
   * localStorage while claiming the database had been updated, is why this whole
   * function exists). Every row is validated (invalid ones are dropped and counted)
   * and de-duplicated against what the account already holds (repeat ones are also
   * dropped and counted), so re-importing the same file twice is a safe no-op rather
   * than a doubling of every number in the account.
   */
  importBackup: async (payload: BackupPayload, userId: string): Promise<ImportResult> => {
    const incomeRows = rows(payload.incomes).map((r) => toIncomeRow(r, userId));
    const expenseRows = rows(payload.expenses).map((r) => toExpenseRow(r, userId));
    const budgetRows = rows(payload.budgets).map((r) => toBudgetRow(r, userId));
    const goalRows = rows(payload.goals).map((r) => toGoalRow(r, userId));
    const categoryRows = rows(payload.customCategories).map((r) => toCategoryRow(r, userId));

    const total =
      incomeRows.length + expenseRows.length + budgetRows.length + goalRows.length + categoryRows.length;

    let skippedInvalid = 0;
    const countInvalid = <T,>(list: (T | null)[]): T[] =>
      list.filter((r): r is T => {
        if (r === null) skippedInvalid++;
        return r !== null;
      });

    const validIncomes = countInvalid(incomeRows);
    const validExpenses = countInvalid(expenseRows);
    const validBudgets = countInvalid(budgetRows);
    const validGoals = countInvalid(goalRows);
    const validCategories = countInvalid(categoryRows);

    // Fetch what the account already holds so a repeat import of the same backup is
    // recognised and skipped instead of duplicated. These calls already route to the
    // right store (Supabase or localStorage) via each service's own isDemoContext()
    // check, so this one function works unmodified for both.
    const [existingIncomes, existingExpenses, existingGoals, existingCategories] = await Promise.all([
      incomeService.getAll(userId),
      expenseService.getAll(userId),
      goalService.getAll(userId),
      categoryService.getAll(userId),
    ]);

    let skippedDuplicate = 0;
    function dedupe<T>(candidates: T[], existing: T[], fingerprint: (item: T) => string): T[] {
      const seen = new Set(existing.map(fingerprint));
      const out: T[] = [];
      for (const item of candidates) {
        const key = fingerprint(item);
        if (seen.has(key)) {
          skippedDuplicate++;
          continue;
        }
        seen.add(key); // also catches a duplicate repeated twice within this same file
        out.push(item);
      }
      return out;
    }

    const dedupedIncomes = dedupe(validIncomes, existingIncomes, incomeFingerprint);
    const dedupedExpenses = dedupe(validExpenses, existingExpenses, expenseFingerprint);
    const dedupedGoals = dedupe(validGoals, existingGoals, goalFingerprint);
    const dedupedCategories = dedupe(validCategories, existingCategories, categoryFingerprint);

    // Budgets dedupe differently: they upsert on (category, period), so re-importing
    // the same budget just refreshes its limit rather than needing to be skipped. The
    // only thing that must not happen is sending two rows for the same (category,
    // period) in one upsert call, which Postgres rejects outright.
    const budgetByKey = new Map<string, (typeof validBudgets)[number]>();
    for (const b of validBudgets) budgetByKey.set(`${b.category}|${b.period}`, b);
    const dedupedBudgets = Array.from(budgetByKey.values());

    // localStorage rows need an id and created_at of their own — Supabase assigns
    // those on insert, but nothing does it for the local store.
    const withDemoId = <T extends object>(row: T): T & { id: string; created_at: string } => ({
      ...row,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });

    if (isDemoContext()) {
      assertWritten(
        localDemoStore.setIncomes([...dedupedIncomes.map(withDemoId), ...existingIncomes] as Income[])
      );
      assertWritten(
        localDemoStore.setExpenses([...dedupedExpenses.map(withDemoId), ...existingExpenses] as Expense[])
      );
      assertWritten(localDemoStore.setGoals([...dedupedGoals.map(withDemoId), ...existingGoals] as Goal[]));
      assertWritten(
        localDemoStore.setCategories([
          ...dedupedCategories.map(withDemoId),
          ...existingCategories,
        ] as CustomCategory[])
      );

      if (dedupedBudgets.length > 0) {
        const currentBudgets = localDemoStore.getBudgets();
        const byKey = new Map(currentBudgets.map((b) => [`${b.category}|${b.period}`, b]));
        for (const b of dedupedBudgets) {
          const key = `${b.category}|${b.period}`;
          const existing = byKey.get(key);
          byKey.set(key, existing ? { ...existing, ...b } : { ...b, id: crypto.randomUUID(), created_at: new Date().toISOString() });
        }
        assertWritten(localDemoStore.setBudgets(Array.from(byKey.values())));
      }

      const imported =
        dedupedIncomes.length + dedupedExpenses.length + dedupedGoals.length + dedupedCategories.length + dedupedBudgets.length;
      return { imported, total, skippedInvalid, skippedDuplicate };
    }

    let imported = 0;
    let dbFailed = 0;

    if (dedupedIncomes.length > 0) {
      const r = await insertChunked('incomes', dedupedIncomes);
      imported += r.inserted;
      dbFailed += r.failed;
    }
    if (dedupedExpenses.length > 0) {
      const r = await insertChunked('expenses', dedupedExpenses);
      imported += r.inserted;
      dbFailed += r.failed;
    }
    if (dedupedGoals.length > 0) {
      const r = await insertChunked('goals', dedupedGoals);
      imported += r.inserted;
      dbFailed += r.failed;
    }
    if (dedupedCategories.length > 0) {
      const r = await insertChunked('custom_categories', dedupedCategories);
      imported += r.inserted;
      dbFailed += r.failed;
    }
    if (dedupedBudgets.length > 0) {
      const { error } = await supabase!
        .from('budgets')
        .upsert(dedupedBudgets, { onConflict: 'user_id,category,period' });
      if (error) {
        console.error('Failed to import budgets:', error);
        dbFailed += dedupedBudgets.length;
      } else {
        imported += dedupedBudgets.length;
      }
    }

    if (imported === 0 && dbFailed > 0) {
      throw new Error('Import failed: no records were written');
    }

    // dbFailed rows are neither imported nor "skipped" in the reported sense (they were
    // valid and new, the database rejected them) — but they must still show up as a gap
    // between imported and total rather than vanishing silently.
    return { imported, total, skippedInvalid, skippedDuplicate: skippedDuplicate + dbFailed };
  },

  /**
   * Demo workspace: restore the seeded sample data. Signed-in account: delete
   * everything the account owns via the reset_user_data RPC (migration 006) — a single
   * transaction, so a failure partway through cannot leave the account half-erased the
   * way five sequential per-table DELETE requests could.
   */
  resetAll: async (userId: string): Promise<void> => {
    if (isDemoContext()) {
      assertWritten(await localDemoStore.resetToDefaults());
      return;
    }

    const { error } = await supabase!.rpc('reset_user_data', { p_user_id: userId });
    if (error) {
      console.error('Failed to reset account data:', error);
      throw error;
    }
  },
};
