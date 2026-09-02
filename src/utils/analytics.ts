import { Income, Expense, Budget, FinancialSummary, CategorySummary, MonthlyTrend, LocaleCode } from '../types';

export const calculateSummary = (
  incomes: Income[],
  expenses: Expense[],
  budgets: Budget[] = []
): FinancialSummary => {
  const totalIncome = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0);
  const budgetUsagePercent = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    activeGoalsCount: 0,
    budgetUsagePercent,
  };
};

export const getExpensesByCategory = (expenses: Expense[]): CategorySummary[] => {
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const map: Record<string, { total: number; count: number }> = {};

  for (const exp of expenses) {
    if (!map[exp.category]) {
      map[exp.category] = { total: 0, count: 0 };
    }
    map[exp.category].total += Number(exp.amount || 0);
    map[exp.category].count += 1;
  }

  const list: CategorySummary[] = Object.entries(map).map(([category, val]) => ({
    category,
    total: val.total,
    percentage: totalExpense > 0 ? (val.total / totalExpense) * 100 : 0,
    count: val.count,
  }));

  return list.sort((a, b) => b.total - a.total);
};

export const getIncomesByCategory = (incomes: Income[]): CategorySummary[] => {
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const map: Record<string, { total: number; count: number }> = {};

  for (const inc of incomes) {
    if (!map[inc.category]) {
      map[inc.category] = { total: 0, count: 0 };
    }
    map[inc.category].total += Number(inc.amount || 0);
    map[inc.category].count += 1;
  }

  return Object.entries(map)
    .map(([category, val]) => ({
      category,
      total: val.total,
      percentage: totalIncome > 0 ? (val.total / totalIncome) * 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.total - a.total);
};

export const getMonthlyTrends = (
  incomes: Income[],
  expenses: Expense[],
  monthsCount = 6,
  locale: LocaleCode = 'ru'
): MonthlyTrend[] => {
  const result: MonthlyTrend[] = [];
  const now = new Date();
  const jsLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // Chart axis labels follow the interface language instead of always being English
    const label = d.toLocaleString(jsLocale, { month: 'short' });

    const monthIncomes = incomes
      .filter((inc) => inc.date.startsWith(yearMonth))
      .reduce((sum, inc) => sum + Number(inc.amount || 0), 0);

    const monthExpenses = expenses
      .filter((exp) => exp.date.startsWith(yearMonth))
      .reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    result.push({
      month: label,
      income: monthIncomes,
      expense: monthExpenses,
      savings: Math.max(0, monthIncomes - monthExpenses),
    });
  }

  return result;
};

export const calculateDailySafeSpend = (
  budgetLimit: number,
  spentSoFar: number
): { safeDaily: number; daysLeftInMonth: number; percentUsed: number } => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, lastDay - now.getDate() + 1);

  const remaining = Math.max(0, budgetLimit - spentSoFar);
  const safeDaily = remaining / daysLeft;
  const percentUsed = budgetLimit > 0 ? (spentSoFar / budgetLimit) * 100 : 0;

  return {
    safeDaily: Math.round(safeDaily * 100) / 100,
    daysLeftInMonth: daysLeft,
    percentUsed,
  };
};
