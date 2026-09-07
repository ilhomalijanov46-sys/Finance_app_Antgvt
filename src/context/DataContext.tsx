import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { incomeService } from '../services/incomeService';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import { categoryService } from '../services/categoryService';
import { Income, Expense, Budget, Goal, FinancialSummary, CustomCategory } from '../types';
import { calculateSummary } from '../utils/analytics';

interface DataContextType {
  incomes: Income[];
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  customCategories: CustomCategory[];
  summary: FinancialSummary;
  isLoading: boolean;
  /** Set when a collection failed to load, so pages don't pass a failure off as "no records". */
  loadError: Error | null;
  /** True while a collection is stuck waiting on the network — also not "no records". */
  isPaused: boolean;
  addIncome: (income: Omit<Income, 'id' | 'created_at'>) => Promise<Income>;
  updateIncome: (id: string, updates: Partial<Omit<Income, 'id' | 'user_id' | 'created_at'>>) => Promise<Income>;
  deleteIncome: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  saveBudget: (budget: Omit<Budget, 'id' | 'created_at'>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>) => Promise<Goal>;
  depositToGoal: (id: string, amount: number) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  addCustomCategory: (cat: Omit<CustomCategory, 'id' | 'created_at'>) => Promise<CustomCategory>;
  deleteCustomCategory: (id: string) => Promise<void>;
  refetchAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Stable identities for "this collection has not loaded yet". A fresh `[]` per render
// would change the memoized context value on every render for no reason.
const NO_INCOMES: Income[] = [];
const NO_EXPENSES: Expense[] = [];
const NO_BUDGETS: Budget[] = [];
const NO_GOALS: Goal[] = [];
const NO_CATEGORIES: CustomCategory[] = [];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'demo-user-777';

  const enabled = Boolean(user);

  // A sign-out (userId -> null) or switching accounts (real -> demo, or one real
  // account to another) must not leave the previous account's rows sitting in the
  // React Query cache: query keys are namespaced by userId so nothing would render
  // them by mistake, but they lingered in memory for the rest of the tab's lifetime.
  const previousUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (previousUserIdRef.current && currentId !== previousUserIdRef.current) {
      queryClient.clear();
    }
    previousUserIdRef.current = currentId;
  }, [user?.id, queryClient]);

  // 0. Custom categories — a per-account query like every other collection, so they are
  // scoped to the signed-in user instead of a single browser-wide localStorage list.
  const categoriesQuery = useQuery({
    queryKey: ['customCategories', userId],
    queryFn: () => categoryService.getAll(userId),
    enabled,
  });

  // 1. Incomes Query
  const incomesQuery = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => incomeService.getAll(userId),
    enabled,
  });

  // 2. Expenses Query
  const expensesQuery = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => expenseService.getAll(userId),
    enabled,
  });

  // 3. Budgets Query
  const budgetsQuery = useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => budgetService.getAll(userId),
    enabled,
  });

  // 4. Goals Query
  const goalsQuery = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => goalService.getAll(userId),
    enabled,
  });

  const customCategories = categoriesQuery.data ?? NO_CATEGORIES;
  const incomes = incomesQuery.data ?? NO_INCOMES;
  const expenses = expensesQuery.data ?? NO_EXPENSES;
  const budgets = budgetsQuery.data ?? NO_BUDGETS;
  const goals = goalsQuery.data ?? NO_GOALS;

  // Mutations
  const addIncomeMutation = useMutation({
    mutationFn: (newInc: Omit<Income, 'id' | 'created_at'>) => incomeService.create(newInc),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes', userId] }),
  });

  const updateIncomeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Income, 'id' | 'user_id' | 'created_at'>> }) =>
      incomeService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes', userId] }),
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id: string) => incomeService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incomes', userId] }),
  });

  const addExpenseMutation = useMutation({
    mutationFn: (newExp: Omit<Expense, 'id' | 'created_at'>) => expenseService.create(newExp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>> }) =>
      expenseService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
  });

  const saveBudgetMutation = useMutation({
    mutationFn: (budget: Omit<Budget, 'id' | 'created_at'>) => budgetService.createOrUpdate(budget),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
  });

  const addGoalMutation = useMutation({
    mutationFn: (newGoal: Omit<Goal, 'id' | 'created_at'>) => goalService.create(newGoal),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>> }) =>
      goalService.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
  });

  const depositGoalMutation = useMutation({
    // The deposit and its linked expense (charging the balance for only what the goal
    // actually accepted, since a deposit is capped at the target) are now a single
    // operation inside goalService.deposit — atomic server-side for a real account, see
    // its own doc comment.
    mutationFn: ({ id, amount }: { id: string; amount: number }) => {
      const targetGoal = goals.find((g) => g.id === id);
      return goalService.deposit(id, amount, targetGoal?.title).then((r) => r.goal);
    },
    // onSettled rather than onSuccess: even if the mutation throws (e.g. the RPC's
    // transaction rolled back), the goal row may have changed under a concurrent
    // deposit from another tab, so the cache is refreshed either way instead of being
    // left showing a stale amount.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => goalService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: (cat: Omit<CustomCategory, 'id' | 'created_at'>) =>
      categoryService.create({ ...cat, user_id: cat.user_id || userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customCategories', userId] }),
  });

  const deleteCategoryMutation = useMutation({
    // Category is stored on incomes/expenses as a plain name string with no foreign
    // key — deleting the category used to leave every transaction that referenced it
    // pointing at a name that no longer exists anywhere (blank/raw text in every list,
    // filter and chart that looks it up). Reassign them to the same catch-all a
    // deleted default category would use ('other' for income, 'miscellaneous' for
    // expense) before the category itself is removed, so nothing is left dangling.
    mutationFn: async (id: string) => {
      const cat = customCategories.find((c) => c.id === id);
      if (cat) {
        if (cat.type === 'income') {
          await incomeService.reassignCategory(userId, cat.name, 'other');
        } else {
          await expenseService.reassignCategory(userId, cat.name, 'miscellaneous');

          // A budget is keyed to its category by the same plain name, and nothing used to
          // touch it here. Once the category was gone its name disappeared from every
          // picker, so no expense could ever be booked against that budget again: it sat
          // on the Budgets page reporting 0 spent of its full limit forever and inflated
          // the total-limit KPI above it. Remove those along with the category — their
          // transactions have just moved to 'miscellaneous', so there is nothing left for
          // such a budget to measure.
          const orphanedBudgets = budgets.filter((b) => b.category === cat.name);
          await Promise.all(orphanedBudgets.map((b) => budgetService.delete(b.id)));
        }
      }
      await categoryService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customCategories', userId] });
      queryClient.invalidateQueries({ queryKey: ['incomes', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] });
    },
  });

  const refetchAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['incomes', userId] }),
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
      queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
      queryClient.invalidateQueries({ queryKey: ['customCategories', userId] }),
    ]);
  };

  // Memoized because this object goes straight into the context value below: rebuilding
  // it on every render gave it a fresh identity every time, which defeated that useMemo
  // entirely — and re-summed every transaction in the account on each render besides.
  const summary = useMemo(() => {
    const next = calculateSummary(incomes, expenses, budgets);
    next.activeGoalsCount = goals.filter((g) => g.current_amount < g.target_amount).length;
    return next;
  }, [incomes, expenses, budgets, goals]);

  // custom_categories is deliberately excluded from the load-failure signal below: it's
  // the one collection that can legitimately not exist yet (a project that hasn't run
  // migration 003), and every page that isn't actually about categories works fine
  // without it. Surfacing the same red "your data failed to load" banner for that as
  // for incomes/expenses/budgets/goals actually failing alarmed the user over nothing
  // while the account's real financial data was loading just fine.
  const collections = [incomesQuery, expensesQuery, budgetsQuery, goalsQuery];

  const isLoading = collections.some((q) => q.isLoading);

  // A collection can also end up *paused*: React Query suspends retries while the browser
  // is offline or the window is unfocused, and the query then stays `pending` with no
  // error. Left unreported that looks exactly like an empty account, so a paused
  // collection counts as "did not load" too.
  const isPaused = collections.some((q) => q.isPaused);

  const loadError = (collections.find((q) => q.error)?.error as Error | undefined) ?? null;

  // useMutation's mutateAsync reference is stable for the lifetime of the hook
  // instance, so memoizing on the data + the mutation objects themselves stops this
  // value from being a fresh object on every render — which previously re-rendered
  // every page consuming useData() on any unrelated state change anywhere above it.
  const value = useMemo<DataContextType>(
    () => ({
      incomes,
      expenses,
      budgets,
      goals,
      customCategories,
      summary,
      isLoading,
      loadError,
      isPaused,
      addIncome: (inc) => addIncomeMutation.mutateAsync(inc),
      updateIncome: (id, updates) => updateIncomeMutation.mutateAsync({ id, updates }),
      deleteIncome: (id) => deleteIncomeMutation.mutateAsync(id),
      addExpense: (exp) => addExpenseMutation.mutateAsync(exp),
      updateExpense: (id, updates) => updateExpenseMutation.mutateAsync({ id, updates }),
      deleteExpense: (id) => deleteExpenseMutation.mutateAsync(id),
      saveBudget: (bud) => saveBudgetMutation.mutateAsync(bud),
      deleteBudget: (id) => deleteBudgetMutation.mutateAsync(id),
      addGoal: (goal) => addGoalMutation.mutateAsync(goal),
      updateGoal: (id, updates) => updateGoalMutation.mutateAsync({ id, updates }),
      depositToGoal: (id, amount) => depositGoalMutation.mutateAsync({ id, amount }),
      deleteGoal: (id) => deleteGoalMutation.mutateAsync(id),
      addCustomCategory: (cat) => addCategoryMutation.mutateAsync(cat),
      deleteCustomCategory: (id) => deleteCategoryMutation.mutateAsync(id),
      refetchAll,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      incomes,
      expenses,
      budgets,
      goals,
      customCategories,
      summary,
      isLoading,
      loadError,
      isPaused,
      addIncomeMutation,
      updateIncomeMutation,
      deleteIncomeMutation,
      addExpenseMutation,
      updateExpenseMutation,
      deleteExpenseMutation,
      saveBudgetMutation,
      deleteBudgetMutation,
      addGoalMutation,
      updateGoalMutation,
      depositGoalMutation,
      deleteGoalMutation,
      addCategoryMutation,
      deleteCategoryMutation,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
