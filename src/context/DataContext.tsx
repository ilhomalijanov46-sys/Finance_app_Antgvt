import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { incomeService } from '../services/incomeService';
import { expenseService } from '../services/expenseService';
import { budgetService } from '../services/budgetService';
import { goalService } from '../services/goalService';
import { localDemoStore } from '../services/mockData';
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

  // Custom Categories state
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => {
    return localDemoStore.getCategories();
  });

  useEffect(() => {
    setCustomCategories(localDemoStore.getCategories());
  }, [user]);

  // 1. Incomes Query
  const { data: incomes = [], isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['incomes', userId],
    queryFn: () => incomeService.getAll(userId),
    enabled: Boolean(user),
  });

  // 2. Expenses Query
  const { data: expenses = [], isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', userId],
    queryFn: () => expenseService.getAll(userId),
    enabled: Boolean(user),
  });

  // 3. Budgets Query
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', userId],
    queryFn: () => budgetService.getAll(userId),
    enabled: Boolean(user),
  });

  // 4. Goals Query
  const { data: goals = [], isLoading: isLoadingGoals } = useQuery({
    queryKey: ['goals', userId],
    queryFn: () => goalService.getAll(userId),
    enabled: Boolean(user),
  });

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
          note: `В цель: ${targetGoal?.title || 'Накопления'}`,
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

  const addCustomCategory = async (cat: Omit<CustomCategory, 'id' | 'created_at'>): Promise<CustomCategory> => {
    const newCat: CustomCategory = {
      ...cat,
      id: 'cat-custom-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const current = localDemoStore.getCategories();
    const updated = [...current, newCat];
    localDemoStore.setCategories(updated);
    setCustomCategories(updated);
    return newCat;
  };

  const deleteCustomCategory = async (id: string): Promise<void> => {
    const current = localDemoStore.getCategories();
    const updated = current.filter((c) => c.id !== id);
    localDemoStore.setCategories(updated);
    setCustomCategories(updated);
  };

  const refetchAll = async () => {
    setCustomCategories(localDemoStore.getCategories());
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['incomes', userId] }),
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] }),
      queryClient.invalidateQueries({ queryKey: ['budgets', userId] }),
      queryClient.invalidateQueries({ queryKey: ['goals', userId] }),
    ]);
  };

  const summary = calculateSummary(incomes, expenses, budgets);
  summary.activeGoalsCount = goals.filter((g) => g.current_amount < g.target_amount).length;

  const isLoading = isLoadingIncomes || isLoadingExpenses || isLoadingBudgets || isLoadingGoals;

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
        addCustomCategory,
        deleteCustomCategory,
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
