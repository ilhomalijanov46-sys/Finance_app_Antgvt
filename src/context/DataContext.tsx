import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { incomeService } from '../services/incomeService';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import { categoryService } from '../services/categoryService';
import { Income, Expense, Budget, Goal, FinancialSummary, CustomCategory } from '../types';
import { calculateSummary } from '../utils/analytics';
import i18n from '../i18n/i18n';

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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id || 'demo-user-777';

  const enabled = Boolean(user);

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

  const customCategories = categoriesQuery.data ?? [];
  const incomes = incomesQuery.data ?? [];
  const expenses = expensesQuery.data ?? [];
  const budgets = budgetsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];

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
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const targetGoal = goals.find((g) => g.id === id);
      const { goal: updated, applied } = await goalService.deposit(id, amount);

      // Automatically record expense to deduct from net balance. Charge only what the
      // goal actually accepted: a deposit is capped at the target, and billing the full
      // request would take money off the balance that never reached the goal.
      if (applied > 0) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        await expenseService.create({
          user_id: userId,
          amount: applied,
          category: 'transfer',
          payment_method: 'card',
          date: dateStr,
          time: timeStr,
          note: i18n.t('goals.transferNote', {
            title: targetGoal?.title || i18n.t('goals.defaultTitle'),
          }),
        });
      }

      return updated;
    },
    onSuccess: () => {
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
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customCategories', userId] }),
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

  const summary = calculateSummary(incomes, expenses, budgets);
  summary.activeGoalsCount = goals.filter((g) => g.current_amount < g.target_amount).length;

  const collections = [incomesQuery, expensesQuery, budgetsQuery, goalsQuery, categoriesQuery];

  const isLoading = collections.some((q) => q.isLoading);

  // A collection can also end up *paused*: React Query suspends retries while the browser
  // is offline or the window is unfocused, and the query then stays `pending` with no
  // error. Left unreported that looks exactly like an empty account, so a paused
  // collection counts as "did not load" too.
  const isPaused = collections.some((q) => q.isPaused);

  const loadError = (collections.find((q) => q.error)?.error as Error | undefined) ?? null;

  return (
    <DataContext.Provider
      value={{
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
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
